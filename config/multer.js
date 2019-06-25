const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        let buf = crypto.randomBytes(16).toString('hex');
        
        cb(
            null,
            `${file.fieldname}-${buf}-${Date.now()}${path.extname(file.originalname)}`
        );
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('imagem');


function checkFileType(file, cb){
    const filetypes = /jpeg|jpg|png|gif/;

    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());    

    if(extname)
        return cb(null, true);
    else
        cb(null, false);
}

module.exports = upload;

