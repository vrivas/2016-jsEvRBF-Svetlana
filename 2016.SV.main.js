/**
 * @file sv16.js
 * @brief Data and main function for the experiments with the data used by Svitlana Goleshchuk in 2016
 *  Data has been taken from:
 *  http://www.global-view.com/forex-trading-tools/forex-history/index.html.
 *  Each time series contains 1304 observations (from January 1, 2010 to December 31, 2014).
 *  First 1043 obsevations are used for training.
 *  Remaining 261 for testing.
 * @date 01/Jul/2016, 19:49
 * @author Victor M. Rivas Santos <vrivas@ujaen.es>
 *         Geneura Team (http://geneura.wordpress.com)
 */
/*
 * --------------------------------------------
 *
 * Copyright (C) 2016 Victor M. Rivas Santos <vrivas@ujaen.es>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */

// Namespace for Svitlana2016 > sv16
var sv16 = {};
sv16.data = [];
sv16.numExecutions = 0; // NUmber of executions in this client
sv16.inputDimension = 1; // Dimension for input patterns = centers' dimension
sv16.trnSamples = []; // Samples for training
sv16.valSamples = []; // Samples for validation
sv16.timer = null;
sv16.bestFitness = 0; // Best fitness found up to this moment in this client
/**
 * Creates the set of samples for training and validation
 * @returns {sv16} Returns sv16 itself to concatenate operations
 */
sv16.createTrnVal = function () {
    do {
        sv16.trnSamples = [];
        sv16.valSamples = [];
        for (var i = 0; i < sv16.data.length - sv16.inputDimension; ++i) {
            if (Math.random() <= 0.5) { // Half the data is used for training+validation
                // 10% is used for validation, 90% for training
                var sample = {
                    "input": sv16.data.slice(i, i + sv16.inputDimension)
                    , "output": sv16.data[i + sv16.inputDimension]
                };
                if (Math.random() >= 0.1) {
                    sv16.trnSamples.push(sample);
                } else {
                    sv16.valSamples.push(sample);
                }
            }
        }
    } while (sv16.valSamples.length <= 0); // Just in case
    return this;
}

/**
 * Tries to forecast the whole dataset, creating the corresponding inputs-output samples
 * @param {type} _net The RBFNN that performs the forecasting (probably, the best one=population().getAt(0)
 * @returns {Array} THe set of outputs computed by the net; one per sample.
 */
sv16.doForecasting = function (_net) {
    var samples = [];
    // Create samples
    for (var i = 0; i < sv16.data.length - sv16.inputDimension; ++i) {
        samples.push({
            "input": sv16.data.slice(i, i + sv16.inputDimension)
            , "output": sv16.data[i + sv16.inputDimension]
        });
    }
    return samples.map(function (e) {
        return _net.apply(e.input);
    });
}


/**
 * Draws a graphic with expected values and yielded ones
 * @param {type} y Expected values
 * @param {type} f Yielded values
 * @returns {sv16} Returns the object sv16 to concatenate operations.
 */
sv16.drawForecasting = function (y, f) {
    var ctx = document.getElementById("forecasting").getContext("2d");
    var data = {
        labels: y.map(function (e, i) {
            return !(i%10)?i:"";
        }),
        datasets: [
            {
                label: "Expected",
                fillColor: "rgba(255,255,255,0.0)",
                strokeColor: "rgba(120,120,220,1)",
                data: y
            }
            , {
                label: "Forecasted",
                fillColor: "rgba(255,255,255,0.0)",
                strokeColor: "rgba(220,120,120,1)",
                //pointColor: "rgba(0,220,0,1)",
                /*pointStrokeColor: "#aaf",
                 pointHighlightFill: "#aaf",
                 pointHighlightStroke: "rgba(220,220,250,1)",*/
                data: f
            }
        ]
    };
    new Chart(ctx).Line(data,
            {
                pointDot: false
                , scaleSteps: 10
                , scaleShowLabels: true
                , responsive: true
                , animation: false
                , legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
            });
    return this;
}

/**
 * Set an unique id for the client, and stores it in sessionStorage. In case it existed, it makes nothing
 * @returns {sv16} Returns the sv16 object to concatenate operations
 */
sv16.setClientInfo = function () {
    sv16.clientInfo = new ClientInfo();
    if (typeof (Storage) !== "undefined") {
        if (typeof (sessionStorage.clientId) !== "undefined") {
            sv16.clientInfo.SetId(sessionStorage.clientId);
            jsEOUtils.debugln("Retrieving id stored in session: " + sessionStorage.clientId);
        } else {
            sessionStorage.clientId = sv16.clientInfo.SetId();
            sv16.clientInfo.SendInfo();
            jsEOUtils.debugln("Storing a new id in session: " + sessionStorage.clientId);
        }
    } else {
        sv16.clientInfo.SetId();
        sv16.clientInfo.SendInfo();
        jsEOUtils.debugln("Creating (but not storing in session) a new id: " + sessionStorage.clientId);

    }
    return this;
}

/**
 * Sends a new solution to the server to be stored in the DDBB
 * @param {type} _rbfnn The net
 * @param {type} _tsme The time-series measured errors yielded by the net
 * @param {type} _url The url to which data has to be sent
 * @returns {sv16} The sv16 object to allow concatenation of operations
 */
sv16.sendNewSolution = function (_rbfnn, _tsme, _url) {
    _url = _url || "/newSolution";
    $.ajax({
        type: 'POST'
        , url: _url
        , data: {
            "problem": jsEOUtils.getProblemId()
            , "clientID": this.clientInfo.GetId()
            , "rbfnn": JSON.stringify(_rbfnn)
            , "tsme": _tsme // time-series measured errors
        }
        , dataType: 'json'
        , success: function (data) {
            console.log("Information about client succesfully sent to server: " + _url
                    + "\n Data received: " + data);
        }
        , error: function (xhr, type) {
            console.log("ERROR: Information about client couldn't be sent to server..." + _url);
        }
    });
    return this;
};

/**
 * Establishes the values and action for button stopTimer
 * @returns {sv16} Returns the sv16 object to concatenate operations
 */
sv16.stopTimerActions = function () {
    $("#stopTimer").click(function () {
        if (sv16.timer != null) {
            clearTimeout(sv16.timer);
            sv16.timer = null;
            $(this).hide();
            jsEOUtils.print("<p>Finally, <strong>all the executions have ended!!</strong> Thanks for helping us!</p>")
            jsEOUtils.print("<p>Do you want to <a href='javascript:history.go(0);'>execute a new set of experiments again?</a></p>");
        }
    });
    return this;
}
/**
 * Main function: sets some properties and executes the evolutionary algorithm
 * @returns {undefined}
 */
sv16.main = function (maxExecutions) {
    maxExecutions = maxExecutions || 1;
    try {
        console.log("Executing jsEvRBF for Svitlana'2016...");

        jsEOUtils.setVerbose(eval(jsEOUtils.getInputParam("verbose", false)));
        jsEOUtils.setProblemId(GLOBLAS.problemId);
        sv16.stopTimerActions();
        sv16.setClientInfo();
        sv16.createTrnVal();
        var algorithm = new js_evrbf.jsEvRBF(
                {"data": sv16.data
                    , "trnSamples": sv16.trnSamples
                    , "valSamples": sv16.valSamples
                    , "numNeurons": 10
                    , "inputDimension": sv16.inputDimension
                    , "tournamentSize": 3
                    , "popSize": 15
                    , "numGenerations": 50
                    , "replaceRate": .2
                    , "xOverRate": .2
                    , "mutRate": 0.8
                    , "mutPower": 0.5
                            //, "opSend": new jsEOOpSendIndividuals()
                            //, "opGet": new jsEOOpGetIndividuals()
                    , "verbose": false
                }
        );
        //jsEOUtils.setShowing(tmp.popSize);
        ++sv16.numExecutions;

        // Writting some pre-execution information:
        jsEOUtils.replace( navigator.userAgent, "sp_browser")
                .replace(sv16.numExecutions, "sp_numExecutions")
                .replace( sv16.numExecutions, "sp_numExecutionsTitle")
                .replace(maxExecutions, "sp_maxExecutions")
                .replace(maxExecutions, "sp_maxExecutionsTitle")
                .replace(((sv16.numExecutions / maxExecutions) * 100).toFixed(1)+"%", "sp_percExecutions");

        algorithm.run(js_evrbf.fitnessFunction);
        var tmpFitness = algorithm.getPopulation().getAt(0).getFitness()
        sv16.bestFitness = (!tmpFitness || sv16.bestFitness > tmpFitness) ? sv16.bestFitness : tmpFitness;
        var expected = sv16.data.slice(sv16.inputDimension); // Removing the numInputs first elements
        var forecasted = sv16.doForecasting(algorithm.getPopulation().getAt(0).getChromosome());
        var tsem = TSEM.setOfErrors(expected, forecasted);
        sv16.sendNewSolution(algorithm.getPopulation().getAt(0).getChromosome(), tsem);
        sv16.drawForecasting(expected, forecasted);
        jsEOUtils.replace(algorithm.getPopulation().getAt(0).getFitness().toFixed(3), "sp_currentFitness")
                .replace(tsem.MAPE.toFixed(3), "sp_currentMAPE")
                .replace(sv16.bestFitness.toFixed(3), "sp_bestFitness");

        jsEOUtils.drawAverageFitness2("myChart");
        if (sv16.numExecutions < maxExecutions) {
            sv16.timer = setTimeout(sv16.main, 3000, maxExecutions);
        } else {
            $("#stopTimer").click();
        }
    } catch (e) {
        console.log("Error: 2016.SV.main: " + e);
    }
}
