var fs = require('fs');
var Material = require('../models/material');
var Product = require('../models/products');

module.exports = function(router, serverlog){

var createProduct = function(req, res, iscreate, product){
    var materialIds = [];
    var errors = [];
    var countMaterials = 0;
    var pstockQuantity = 0;
    var logSentence = '';

    if(iscreate){
        logSentence = 'There no materials for this product! Product cannot be created!';
    } else {
        logSentence = 'There no materials for this product! Product cannot be Updated!';
    }

    for(var i = 0; i < req.body.materials.length; i++){
        materialIds[i] = req.body.materials[i].material_id;
    }
    Material.find().where('_id').in(materialIds).exec((err, materials) => {
        if(err){
            res.status(500).json({
                success: false,
                error: err
            });
            fs.appendFile(serverlog, `${err}\n`);
            return;
        }
        if(materials.length <= 0){
            res.status(404).json({
                success: false,
                message: logSentence
            });
            fs.appendFile(serverlog, logSentence);
            return;
        }
        for(var m_aux = 0; m_aux < materials.length; m_aux++){
            for(var m_req = 0; m_req < materialIds.length; m_req++){
                if(req.body.materials[m_req].material_id == materials[m_aux]._id){
                    if(iscreate){
                        pstockQuantity = req.body.stock;
                    } else {
                        if (req.body.stock > product.stock) {
                            pstockQuantity = req.body.stock - product.stock;
                        } else {
                            pstockQuantity = 0;
                        }
                    }
                    if(pstockQuantity === 0){
                        countMaterials++;
                        if(countMaterials === materials.length){
                            newProduct(errors, req, res, product, iscreate);
                        }
                    } else {
                        materials[m_aux].stock = materials[m_aux].stock - req.body.materials[m_req].quantity * pstockQuantity;
                        if(materials[m_aux].stock < 0){
                            res.status(200).json({
                                success: false,
                                message: 'There are not enough materials in stock!'
                            });
                            fs.appendFile(serverlog, 'There are not enough materials in stock!\n');
                            m_aux=materials.length;
                            m_req=materialIds.length;
                            return;
                        }
                        materials[m_aux].lastUpdate = new Date();
                        materials[m_aux].save((err) => {
                            countMaterials++;
                            if(err) errors.push(err);
                            if(countMaterials === materials.length){
                                newProduct(errors, req, res, product, iscreate);
                            }
                        });
                    }
                }
            }
        }
    });
};

var newProduct = function (errors, req, res, product, iscreate){
    var messageLog = '';
    if(errors.length !== 0){
        res.status(500).json({
            success: false,
            error: errors
        });
        fs.appendFile(serverlog, `${errors}\n`);
    } else {
        product.name = req.body.name;
        product.cost = req.body.cost;
        product.size = req.body.size;
        product.price = req.body.price;
        product.prod_time = req.body.prod_time;
        product.description = req.body.description;
        product.materials = req.body.materials;
        product.stock = req.body.stock;
        product.user_id = req.decoded._doc._id;
        if(iscreate){
            messageLog = `Product ${product.name} created!\n`;
            product.created_on = new Date();
            product.lastUpdate = product.created_on;
        } else {
            messageLog = `Product ${product.name} updated!\n`;
            product.lastUpdate = new Date();
        }

        product.save((err) => {
            if(err){
                res.status(500).json({
                    success: false,
                    error: err
                });
                fs.appendFile(serverlog, `${err}\n`);
            } else {
                fs.appendFile(serverlog, messageLog + `\n`);
                res.status(200).json({
                    success: true,
                    message: messageLog
                });
            }
        });
    }
};

router.route('/products')
    .post((req, res) => {
        var product = new Product();
        var iscreate = true;
        createProduct(req, res, iscreate, product);
    })

    .get((req, res) => {
        Product.find().where('user_id').in(req.decoded._doc._id).exec((err, products) => {
            if(err){
                res.status(500).json({
                    success: false,
                    error: err
                });
                fs.appendFile(serverlog, `${err}\n`);
            } else {
                res.status(200).json({
                    success: true,
                    results: products
                });
                fs.appendFile(serverlog,`List of products: ${products}\n`);
            }
        });
    });

router.route('/products/:product_id')
    .get((req, res) => {
        Product.findById(req.params.product_id, (err, product) => {
            if(err){
                res.status(500).json({
                    success: false,
                    error: err
                });
                fs.appendFile(serverlog, `${err}\n`);
            } else {
                if(!product){
                    res.status(404).json({
                        success: false,
                        message: 'Product not found.'
                    });
                    fs.appendFile(serverlog,`${product}\n`);
                    return;
                }
                fs.appendFile(serverlog,`${product}\n`);
                res.status(200).json({
                    success: true,
                    results: product
                });
            }
        });
    })

    .put((req, res) => {
        var iscreate = false;
        Product.findById(req.params.product_id, (err, product) => {
            if(err){
                res.status(500).json({
                    success: false,
                    error: err
                });
                fs.appendFile(serverlog, `${err}\n`);
            } else {
                if(!product){
                    res.status(404).json({
                        success: false,
                        message: 'Product not found.'
                    });
                    fs.appendFile(serverlog,`${product}\n`);
                    return;
                }
                createProduct(req, res, iscreate, product);
            }
        });
    })

    .delete((req, res) => {
        Product.remove({
            _id: req.params.product_id
        }, (err, product) => {
            if(err){
                res.status(500).json({
                    success: false,
                    error: err
                });
                fs.appendFile(serverlog, `${err}\n`);
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Successfully deleted!'
                });
                fs.appendFile(serverlog,`Product successfully deleted!`);
            }
        });
    });

};