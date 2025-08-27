const multer = require('multer');
const path = require('path');

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/'); // Carpeta donde se guardarán las fotos
  },
  filename: (req, file, cb) => {
    // Nombre del archivo: timestamp + "_" + nombre original
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, "_"); // reemplaza espacios por _
    cb(null, `${timestamp}_${originalName}`);
    console.log(timestamp);
  }
});

const upload = multer({ storage });

module.exports = upload;
