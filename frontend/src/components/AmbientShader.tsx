import React, { useEffect, useRef } from 'react';

interface AmbientShaderProps {
  cortisol: number;   // 0.0 to 1.0
  dopamine: number;   // 0.0 to 1.0
}

export const AmbientShader: React.FC<AmbientShaderProps> = ({ cortisol, dopamine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    // Vertex Shader Source
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader Source (breathing organic liquid)
    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform float u_cortisol;
      uniform float u_dopamine;

      // Simple hash noise
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = v_texCoord;
        
        // Dynamic organic coordinates
        vec2 p = uv * 3.0;
        p.x += sin(u_time * 0.15 + p.y * 1.5) * 0.4;
        p.y += cos(u_time * 0.11 + p.x * 1.2) * 0.4;
        
        float n = noise(p);
        
        // Theme Colors
        vec3 baseColor = vec3(0.0, 0.09, 0.06);     // #00170f Primordial Forest
        vec3 sageColor = vec3(0.55, 0.66, 0.61);     // #8da89b Sage
        vec3 goldColor = vec3(0.87, 0.76, 0.63);     // #dec2a0 Champagne Gold
        vec3 redColor = vec3(1.0, 0.70, 0.67);      // #ffb4ab Cortisol Red
        
        // Base liquid blend
        vec3 color = mix(baseColor, sageColor, n * 0.35);
        
        // Incorporate chemical states
        color = mix(color, redColor, u_cortisol * 0.45);
        color = mix(color, goldColor, u_dopamine * 0.3);
        
        // Smooth vignette
        float vignette = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y) * 16.0;
        color *= pow(vignette, 0.3);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // Helper compile
    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Buffer setups
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uCortisol = gl.getUniformLocation(program, 'u_cortisol');
    const uDopamine = gl.getUniformLocation(program, 'u_dopamine');

    let animationFrameId: number;
    let startTime = Date.now();

    const resize = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    const render = () => {
      resize();
      
      const elapsedSeconds = (Date.now() - startTime) / 1000.0;
      
      gl.uniform1f(uTime, elapsedSeconds);
      gl.uniform1f(uCortisol, cortisol);
      gl.uniform1f(uDopamine, dopamine);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, [cortisol, dopamine]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-30"
    />
  );
};
