const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert("WebGL not supported. Please use a compatible browser.");
}

// this allows for the vertex shader
const vertexShaderSource = `
    attribute vec4 aPosition;
    attribute vec4 aColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
        vColor = aColor;
    }
`;

// this is the fragment shader
const fragmentShaderSource = `
    precision mediump float;
    varying lowp vec4 vColor;
    uniform vec4 uColor;

    void main(void) {
        gl_FragColor = vColor * uColor; // Multiply base color with dynamic color
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initShaderProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Shader program linking failed:', gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
const programInfo = {
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aColor'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        uColor: gl.getUniformLocation(shaderProgram, 'uColor'),
    },
};

// this code establishes the vertex positions and colors on each vertex of a 3D cube
const positions = new Float32Array([
    // Front face (turquoise)
    -1.0, -1.0,  1.0,  0.0, 1.0, 1.0,
    1.0, -1.0,  1.0,  0.0, 1.0, 1.0,
    1.0,  1.0,  1.0,  0.0, 1.0, 1.0,
    -1.0,  1.0,  1.0,  0.0, 1.0, 1.0,
    // this is the back face to show other colors
    -1.0, -1.0, -1.0, 1.0, 0.0, 0.0,
    1.0, -1.0, -1.0, 1.0, 0.0, 0.0,
    1.0,  1.0, -1.0, 1.0, 0.0, 0.0,
    -1.0,  1.0, -1.0, 1.0, 0.0, 0.0,
    // Other faces...
]);

const indices = new Uint16Array([
    0, 1, 2,    0, 2, 3,    // front face
    4, 5, 6,    4, 6, 7,    // back face
    // here we are adding indices for other faces
]);

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return { position: positionBuffer, indices: indexBuffer };
}

const buffers = initBuffers(gl);

function getDynamicColor() {
    const time = Date.now() * 0.001;
    const red = (Math.sin(time) + 1) / 2;
    const green = (Math.cos(time) + 1) / 2;
    const blue = (Math.sin(time * 0.5) + 1) / 2;
    return [red, green, blue, 1.0];
}

function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    const projectionMatrix = mat4.create();
    const modelViewMatrix = mat4.create();

    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, Date.now() * 0.001, [0, 1, 0]);

    gl.useProgram(shaderProgram);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    const dynamicColor = getDynamicColor();
    gl.uniform4fv(programInfo.uniformLocations.uColor, dynamicColor);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 6 * 4, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

function render() {
    drawScene(gl, programInfo, buffers);
    requestAnimationFrame(render);
}
render();



