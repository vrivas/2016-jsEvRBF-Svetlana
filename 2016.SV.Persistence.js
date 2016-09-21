/**
 *  @file    2016.SV.Persistence.js
 *  @author  Victor M. Rivas Santos <vrivas@ujaen.es>
 *  @date    01/Jul/2016, 19:51
 *  @desc    Functions used to store information in database
 *
 *  -------------------------------------
 *  GeNeura Team (http://geneura.ugr.es)
 */
/// variable storing the db handler
var mongoose = require('mongoose');

var Schema = mongoose.Schema
        , ObjectId = Schema.ObjectId;

/// Fields containing navigators' information
var navigatorSchema = new Schema({
    Id: ObjectId
    , date: {type: Date, default: Date.now}
    , clientId: String
    , userAgent: String
    , problemId: String
});


var solutionSchema = new Schema({
    Id: ObjectId
    , date: {type: Date, default: Date.now}
    , problem: String
    , clientId: String
    , rbfnn: String
    , tsme: {
        MSE: Number
        , RMSE: Number
        , MAE: Number
        , MdAE: Number
        , MAPE: Number
        , MdAPE: Number
        , RMSPE: Number
        , RMdSPE: Number
        , sMAPE: Number
        , sMdAPE: Number
        , MASE: Number
        , RMSSE: Number
        , MdASE: Number
    }
});


var db = {
    navigatorModel: null
    , solutionModel: null
    , problemRequestModel: null
    , setNavigatorModel: function (experimentId) {
        this.navigatorModel = mongoose.model('navigator_' + experimentId, navigatorSchema);
    }
    , setSolutionModel: function (experimentId) {
        this.solutionModel = mongoose.model('solution_' + experimentId, solutionSchema);
    }
    , setModels: function (experimentId) {
        this.setNavigatorModel(experimentId);
        this.setSolutionModel(experimentId);
    }
    , connect: function (server, db) {
        mongoose.connect("mongodb://" + server + "/" + db);
    }
    ,
    /**
     * Saving a new navigator's info in DDBB
     * @param {type} clientId
     * @param {type} userAgent
     * @returns {undefined}
     */
    saveNavigatorInfo: function (clientId
      , userAgent
    , problemId) {
        this.navigatorModel.create(
                {
                    'clientId': clientId
                    , 'userAgent': userAgent
                    , 'problemId': problemId
                }
        , function (err, small) {
            if (err)
                return handleError(err);
            //console.log("Navigator's info stored in DDBB: " + clientId + ", " + userAgent);
        });
    }
    ,
    /**
     * Stores a new Solution in DDBB
     * @param {NewSolution} aNewSolution
     * @returns {voId}
     */
    saveNewSolution: function (problemId, clientId, rbfnn, tsme) {
        /*
         console.log("Trying to store a new Solution's  in DDBB: "
         + " Problem: " + problem
         + " Client Id: " + clientId
         + " RBFNN: " + rbfnn
         + " Errors: " + tsme);
         */
        // Fixing NaN errors
        for( i in tsme ) {
          tsme[i]=(isNaN(tsme[i]))?1e6:tsme[i];
        }
        this.solutionModel.create({
            'problemId': problemId
            , 'clientId': clientId
            , 'rbfnn': rbfnn
            , 'tsme': tsme
        }
        , function (err, small) {
            if (err)
                return handleError(err);
            else
                return ("New Solution's info stored in DDBB: "
                        + " Problem Id: " + problemId
                        + " Client Id: " + clientId
                        + " RBFNN: " + rbfnn
                        + " Errors: " + tsme);
        });
    }
};
