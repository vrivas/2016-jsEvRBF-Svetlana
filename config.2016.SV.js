/**
 *  @file   config.js
 *  @author  Victor M. Rivas Santos <vrivas@ujaen.es>
 *  @date    22-Dec-2015 , 20:13
 *  @desc    Specific server's configuration
 *
 *  -------------------------------------
 *  GeNeura Team (http://geneura.ugr.es)
 */

var GLOBALS = {
    'ipaddress': '127.0.0.1' || process.env.OPENSHIFT_NODEJS_IP
    , 'port': 8080 || process.env.OPENSHIFT_NODEJS_PORT
    , 'persistenceFile': './2016.SV.Persistence.js'
    , 'experimentId': 'SV2016FORECASTING'
}
