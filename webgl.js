
 var gl;
 var shaderProgram;
 var zoom = 1.0;
 var uniforms = ["zoom", "panX", "panY"];
 var uVals = { zoom: 1.5, panX: 0.0, panY: 0.0, panXVel: 0.0, panYVel: 0.0};
 var isHeart = true;
 var pre_shader_script = heartMap("float _result = 1.0;");
 var pre_shader_scripts = [];


 function initGL(canvas) {
     try {
         gl = canvas.getContext("experimental-webgl");
         gl.viewportWidth = canvas.width;
         gl.viewportHeight = canvas.height;
     } catch (e) {
     }
     if (!gl) {
         alert("Could not initialise WebGL, sorry :-(");
     }
 }

 function getShader(gl, id) {
     var shaderScript = document.getElementById(id);
     if (!shaderScript) {
         return null;
     }

     var str = "";
     var k = shaderScript.firstChild;
     while (k) {
         if (k.nodeType == 3) {
             str += k.textContent;
         }
         k = k.nextSibling;
     }

     var shader;
     if (shaderScript.type == "x-shader/x-fragment") {
         shader = gl.createShader(gl.FRAGMENT_SHADER);
     } else if (shaderScript.type == "x-shader/x-vertex") {
         shader = gl.createShader(gl.VERTEX_SHADER);
     } else {
         return null;
     }

     gl.shaderSource(shader, str);
     gl.compileShader(shader);

     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
         alert(gl.getShaderInfoLog(shader));
         return null;
     }
    return shader;
 }


 function initShaders() {
     var fragmentShader = getShader(gl, "shader-fs");
     var vertexShader = getShader(gl, "shader-vs");
     var i;

     shaderProgram = gl.createProgram();
     gl.attachShader(shaderProgram, vertexShader);
     gl.attachShader(shaderProgram, fragmentShader);
     gl.linkProgram(shaderProgram);

     if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
         alert("Could not initialise shaders");
     }

     gl.useProgram(shaderProgram);

     shaderProgram.vertexPositionAttribute =
       gl.getAttribLocation(shaderProgram, "aVertexPosition");
     gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

     shaderProgram.mvpMatrixUniform = gl.getUniformLocation(shaderProgram,
                                       "ModelViewProjectionMatrix");

     for (i in uniforms) {
       shaderProgram[uniforms[i] + "Uniform"] =
         gl.getUniformLocation(shaderProgram, uniforms[i]);
     }

 }

  var mvpMatrix = mat4.create();
  mat4.identity(mvpMatrix);
  var squareVertexPositionBuffer;

 function initBuffers() {
    var meshSize = 1;
    squareVertexPositionBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);

     vertices = mesh(meshSize);
     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
     squareVertexPositionBuffer.itemSize = 2;
     squareVertexPositionBuffer.numItems = vertices.length / 2 ;
 }

 function drawScene() {
//   var startTime = (new Date()).getTime(), endTime;

   gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
   gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
                              squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
   gl.uniformMatrix4fv(shaderProgram.mvpMatrixUniform, false, mvpMatrix);

   // Set the unfiroms
   for (i in uniforms) {
     gl.uniform1f(shaderProgram[uniforms[i] + "Uniform"],uVals[uniforms[i]]);
   }

   gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);


//   endTime = (new Date()).getTime();
//   console.log(endTime - startTime);

 }

/* For some reason WebGL just hates the (x,y) value (0.0, 0.0). We add a small error value
   to prevent this problem */
function mesh(n) {
   var a = new Float32Array(2*(2*(n*(n+1))  + 2*(n-1)   ));
   var i, j, len = 0;
   var delta = 2.0 / n + 0.000000000000001;

   var x, y = -1.0;
   for (j = 0; j < n; j++, y+=delta) {
     if (j > 0) {
       /* Degenerate triangles */
        a[len++] = 1.0; // x value
        a[len++] = y; // y value
        a[len++] = -1.0; // x value
        a[len++] = y; // y value
     }

     for (i = 0, x = -1.0; i <= n; i++, x+=delta) {
       a[len++] = x; // x value
       a[len++] = y; // y value
       a[len++] = x; // x value
       a[len++] = y+delta; // y value
     }
  }
  return a;
}

function keyHandler(e) {

  console.log(e.which);
  var key = e.which;


  var panInc = 0.05*uVals.zoom;
  var zoomFactor = 1.1;


  if (key===61||key===43) {
    uVals.zoom /= zoomFactor;
  }

  if (key===45||key==95) {
    uVals.zoom *= zoomFactor;
  }

  // W
  if (key===119) {
    uVals.panY -= panInc;
  }

  // A
  if (key===97) {
     uVals.panX += panInc;
  }

  // S
  if (key===115) {
    uVals.panY += panInc;
  }

  // D
  if (key===100) {
     uVals.panX -= panInc;
  }

  // >
  if (key===62||key===46) {

    pre_shader_scripts.push(pre_shader_script);
    if (isHeart) {
      pre_shader_script = scale("16.0", tile(pre_shader_script));
    } else {
      pre_shader_script = heartMap(scale("1.0/16.0", pre_shader_script));
    }
    isHeart = !isHeart;
    webGLStart();
  }

  if (key===44||key===60) {
      if (pre_shader_scripts.length > 0) {
      pre_shader_script = pre_shader_scripts.pop();
      isHeart = !isHeart;
    }
    webGLStart();
  }

  drawScene();

}

function replaceVars(str) {
  var re = new RegExp("(_[a-zA-Z]*1*)", "g");
  return str.replace(re, "$11");
}

// //
// // Takes a GLSL function that takes parameters with prefix _x and _y
// // and creates a new function that scales that function.
// //
function scale(s, glsl) {
  var glsl_ = replaceVars(glsl);
  return("\
float _result = 0.0;\n\
if (true) {\n\
  float _x1 = _x * " + s + ";\n\
  float _y1 = _y * " + s + ";\n" + glsl_ + "\n\
  _result = _result1;\n\
}\n\
");
}

function pan(xPan, yPan, glsl) {
  var glsl_ = replaceVars(glsl);
  return("\
float _result = 0.0;\n\
float _x1 = _x + " + xPan + ";\n\
float _y1 = _y + " + yPan + ";\n" + glsl_ + "\
_result = _result1;\
");
}

function tile(glsl) {
  var glsl_ = replaceVars(glsl);
  return("\
float _result = 0.0;\n\
float _w  = 1.3;\n\
if (true) {\n\
  float _x1 = mod(_x,_w*2.0) - _w;\n\
  float _y1 = mod(_y,_w*2.0) - _w;\n" + glsl_ + "\n\
  _result = _result1;\
}\n\
");
}

function heartMap(glsl) {
  var glsl_ = replaceVars(glsl);
  return("\
float _result = 0.0;\n\
float _sgn   = _y > 0.0 ? 1.0 : -1.0;\n\
float _d     = _x*_x + _y*_y - _sgn*pow(_x*_x*_y*_y*_y*_sgn,0.3333);\n\
float _e     = 1.0/(1.0 - pow(_d,0.1));\n\
float _theta = atan(_y,_x);\n\
if (_d < 1.0) {\n\
  float _x1 = _e*cos(_theta);\n\
  float _y1 = _e*sin(_theta);\n" + glsl_ + "\n\
  _result = _result1;\n\
}\n\
");
}

// 2 / 800 =  0.0025
function antiAlias(glsl) {
  var glsl_1 = replaceVars(glsl);
  var glsl_2 = replaceVars(glsl_1);
  var glsl_3 = replaceVars(glsl_2);
  var glsl_4 = replaceVars(glsl_3);
  var glsl_5 = replaceVars(glsl_4);
  var glsl_6 = replaceVars(glsl_5);
  var glsl_7 = replaceVars(glsl_6);
  var glsl_8 = replaceVars(glsl_7);
  return("\
float _result;\n\
float _d = 0.00125 * zoom;\n\
float _x_right = _x + _d;\n\
float _x_left = _x - _d;\n\
float _y_up = _y + _d;\n\
float _y_down = _y - _d;\n\
float _x1 = _x_left;\n\
float _y1 = _y;" + glsl_1 + "\n\
float _x11 = _x_right;\n\
float _y11 = _y;" + glsl_2 + "\n\
float _x111 = _x_left;\n\
float _y111 = _y_up;" + glsl_3 + "\n\
float _x1111 = _x;\n\
float _y1111 = _y_up;" + glsl_4 + "\n\
float _x11111 = _x_right;\n\
float _y11111 = _y_up;" + glsl_5 + "\n\
float _x111111 = _x_left;\n\
float _y111111 = _y_down;" + glsl_6 + "\n\
float _x1111111 = _x;\n\
float _y1111111 = _y_down;" + glsl_7 + "\n\
float _x11111111 = _x_right;\n\
float _y11111111 = _y_down;" + glsl_8 + "\n\
_result = (_result1 + _result11 + _result111 + _result1111 +\n\
           _result11111 + _result111111 + _result1111111 + _result11111111) / 8.0;\n\
");
}

function fragShader(glsl) {
  return("\
precision highp float;\n\
\n\
varying vec3 vPos;\n\
uniform float zoom;\n\
uniform float panX;\n\
uniform float panY;\n\
\n\
void main(void) {\n\
  float _x = vPos.x;\n\
  float _y = vPos.y;\n" + glsl +"\n\
\n\
  gl_FragColor = vec4(_result * 0.7,0.0,0.0,1.0);\n\
}");

}

function make_shader_script(glsl) {
  return fragShader(scale("zoom", pan("panX", "panY", antiAlias(glsl))));
}


function webGLStart() {
  $('#shader-fs').html(make_shader_script(pre_shader_script));
  var canvas = document.getElementById("canvas");
  initGL(canvas);
  initShaders();
  initBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  drawScene();
}
