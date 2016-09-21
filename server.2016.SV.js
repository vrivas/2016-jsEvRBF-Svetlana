/**
 *  @file   server.js
 *  @author  Victor M. Rivas Santos <vrivas@ujaen.es>
 *  @date    06-dic-2014 , 14:10:02
 *  @desc    Trying to send objects via SSE using JSON
 *
 *  -------------------------------------
 *  GeNeura Team (http://geneura.ugr.es)
 */
// Including libraries
var fs = require('fs');
eval(fs.readFileSync('./config.2016.SV.js') + '');
//eval(fs.readFileSync('./iconio.Date.js') + '');
eval(fs.readFileSync(GLOBALS.persistenceFile) + '');
//eval(fs.readFileSync('iconio.Experiment.js') + '');


function distance(data1, data2) {
    return Math.abs(data1 - data2);
}
function minDist(target, cand1, cand2) {
    return(distance(target, cand1) <= distance(target, cand2)) ? cand1 : cand2;
}

/**
 * Making AJAX and SSE available from everywhere
 * @param {type} res Response to be given to the client
 * @returns {undefined}
 */
function allowCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Request-Method', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', '*');
}

function setClientId() {
    return (new Date()).getTime() + "" + parseInt(Math.random() * 1e5);
}

function errorMessage(message) {
    return "!!!! " + message;
}

/**
 * Reads a file and converts its lines into an array.
 * Valid ONLY for files with ONE float value per line
 * @param {String} fileName The name of the file
 * @returns {array of floats} The array containing the floats 
 */
function file2array(fileName) {
    return fs.readFileSync(fileName)
            .toString()
            .split("\n")
            .filter(function (e) {
                return e.length > 0;
            })
            .map(function (e) {
                return parseFloat(e);
            });
}
/**
 * Object containing many callbacks dealing with server-client communications
 * @type Object
 */
var cb = {
    /**
     * Saves info about a new client that has connected
     * @param {type} req
     * @param {type} res
     * @param {type} mongoose
     * @returns {undefined}
     */

    saveClientInformation: function (req, res, mongoose) {
        req.body.initTime = Date.now();
        /*
         
         console.log("Client information ");
         for (b in req.body) {
         console.log(b + ": " + req.body[b]);
         }
         */
        // Storing in database
        db.saveNavigatorInfo(req.body["clientID"], req.body["userAgent"]);
        allowCORS(res)
        res.writeHead(200, {"Content-type": "application/json"});
        res.write(JSON.stringify({"message": "ok"}));
        res.send();
    }

    , saveNewSolution: function (req, res) {

//console.log("SaveNewSolution");

        db.saveNewSolution(
                req.body["problem"]
                , req.body["clientID"]
                , req.body["rbfnn"]
                , req.body["tsme"]
                );
        allowCORS(res)
        res.writeHead(200, {"Content-type": "application/json"});
        res.write(JSON.stringify({"message": "ok"}));
        res.send();
    }
    /**
     * Returns data according to the name of the problem
     * @param {type} req
     * @param {type} res
     * @returns {undefined} If everything gos right, a JSON object containing training and test sets, with a 200 http code.
     * If there exists any problem, a JSON containing a mesage with a 401 error http code.
     */
    , getData: function (req, res) {
        var filePath = "./data/" + req.query["data_name"];
        allowCORS(res)
        var trn = [];
        var tst = [];
        var error = false;
        try {
            trn = file2array(filePath + ".trn");
            tst = file2array(filePath + ".tst");
        } catch (e) {
            error = e;
            console.log(errorMessage(e));
        }
        if (!error) {
            res.writeHead(200, {"Content-type": "application/json"});
            res.write(JSON.stringify({
                "data_name": req.query["data_name"]
                , "trn": trn
                , "tst": tst
            }));
        } else {
            res.writeHead(401, {"Content-type": "application/json"});
            res.write(JSON.stringify({
                "data_name": req.query["data_name"]
                , "message": "File Not Found: " + error
            }));
            res.send();
        }
    }
};
/**
 * Main function
 * @return {undefined}
 */
function main() {

// Variables needed by node to act as a server
    var express = require('express');
    var app = express();
    // Serving static files
    app.use(express.static(__dirname + ''));
    app.use(express.bodyParser());
    console.log("Server for Svitlana2016's experiment started...");
    try {
        // DDBB connection
        //Comentado para mac
        db.setModels(GLOBALS.experimentId)
        // Comentado para mac
        db.connect("localhost", "test");
    } catch (e) {
        console.log(
                errorMessage("Error in main due to connection with database: "
                        + e)
                );
    }

    try {
        app.post('/clientInformation', function (req, res) {
            cb.saveClientInformation(req, res, mongoose);
        });
        app.post('/newSolution', function (req, res) {
            cb.saveNewSolution(req, res);
        });
        app.get('/getData', function (req, res) {
            cb.getData(req, res);
        })
    } catch (e) {
        console.log(errorMessage("Error in main due to any app.ACTION: " + e));
    }

    try {
        console.log("Trying to init server in ", GLOBALS.ipaddress, ":", GLOBALS.port, "...\n");
        server = app.listen(GLOBALS.port, GLOBALS.ipaddress, function () {
            var host = server.address().address;
            var port = server.address().port;
            console.log('Example app listening at http://%s:%s', host, port);
        });
    } catch (e) {
        console.log(errorMessage("Error in main due to app.listen: " + e));
    }

    return 1;
}


/**
 * Main program
 */
main(); // Defines and executes main
