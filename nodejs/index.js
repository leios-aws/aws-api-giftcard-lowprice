const config = require('config');
const async = require('async');
const AWS = require('aws-sdk');
AWS.config.update({
    region: 'ap-northeast-2',
    endpoint: "http://dynamodb.ap-northeast-2.amazonaws.com"
});

//const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

var now;

var traceProducts = [
    "컬쳐랜드",
    "해피머니",
    "도서문화상품권",
    "롯데",
    "신세계",
];

var getProductId = function (item) {
    for (var i = 0; i < traceProducts.length; i++) {
        if (item.title.indexOf(traceProducts[i]) > -1) {
            return traceProducts[i];
        }
    }
    return null;
};

exports.handler = function (event, context, callback) {
    now = Math.floor(Date.now() / 1000);

    async.mapSeries(traceProducts, function(product, callback) {
        var queryParams = {
            TableName: 'webdata',
            KeyConditionExpression: "#site = :site and #ts = :ts",
            ExpressionAttributeNames: {
                "#site": "site",
                "#ts": "timestamp"
            },
            ExpressionAttributeValues: {
                ":site": product,
                ":ts": 0
            }
        };

        docClient.query(queryParams, (err, res) => {
            var response = {product: product};
            if (err) {
                console.log(err);
            }

            if (res && res.Items && res.Items.length > 0 && res.Items[0].data) {
                response.data = res.Items[0].data;
            }

            callback(err, response);
        });
    }, function(err, results) {
        callback(err, {
            "statusCode": 200,
            "headers": {
            },
            "body": JSON.stringify(results),
            "isBase64Encoded": false
        });
    });
};
