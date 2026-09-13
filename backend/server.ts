// server.ts
//
// Bootstrap mínimo: carga el .env de la raíz del repo ANTES de traer el
// resto de la app. Usa require() en vez de import a propósito — ver el
// comentario en start.ts sobre el hoisting de imports.
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

require("./start");
