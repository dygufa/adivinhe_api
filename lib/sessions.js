/**
* Desenvolvido por Guilherme Sehn
*/

/* Funções */
exports.start = function (req, res, callback) {
    var manager = {
        set: function (key, value) {
            console.log(key, value);
            return true;
        },

        get: function (key) {
            if (!req.user[key]) {
                return null;
            }

            return req.user[key];
        },

        unset: function (key) {
            console.log(key);
        }
    };

    callback(manager);
};