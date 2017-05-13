var fs = require('fs');
var User = require('../models/users');

module.exports = function(router, serverlog){
router.route('/user')
    .get((req, res) => {
        User.find((err, users) => {
            if(err){
                res.status(500).json({
                    success: false,
                    error: err
                });
                fs.appendFile(serverlog, `${err}\n`);
            } else {
                fs.appendFile(serverlog,`${users}\n`);
                res.status(200).json({
                    success: true,
                    results: users
                });
            }
        });
    });
router.route('/user/:user_id')
    .delete((req, res) => {
        User.remove({
            _id: req.params.user_id
        }, (err, user) => {
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
                fs.appendFile(serverlog,`User successfully deleted!`);
            }
        });
    });
};