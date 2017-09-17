'use strict';

var q = require('q'),
    moment = require('moment'),
    Medication = require('./medication.model');

exports.index = function (req, res) {
    var query = {};
    if (req.query.start && req.query.end) {
        query = {
            $and: [
                { time: { $gte: moment(req.query.start, 'MM/DD/YYYY HH:mm:ss').toDate() } },
                { time: { $lte: moment(req.query.end, 'MM/DD/YYYY HH:mm:ss').toDate() } }
            ]
        };
    } else if (req.query.end)
    {
        query.time = { $lte: moment(req.query.end, 'MM/DD/YYYY HH:mm:ss').toDate() };
    }

    if (req.query.completed)
    {
        query.completed = req.query.completed;
    }

    q(Medication.find(query).sort({'time': 1}).exec()).then(function (meds) {
        res.json(meds);
    }).catch(function (err) {
        console.error('Error occurred listing medications', err);
        res.send(500);
    });
};

exports.show = function (req, res) {
    q(Medication.findById(req.params.id).exec()).then(function (med) {
        if (med) {
            res.json(med);
        } else {
            res.send(404);
        }
    }).catch(function (err) {
        console.error('Error occurred getting medication', err);
        res.send(500);
    });
};

exports.findOne = function (req, res) {
    var query = {};
    if (req.query.start) {
        query.time = { $gte: moment(req.query.start, 'MM/DD/YYYY HH:mm:ss').toDate() };
    }

    if (req.query.completed)
    {
        query.completed = req.query.completed;
    }

    q(Medication.findOne(query).sort({'time': 1}).exec()).then(function (med) {
        if (med) {
            res.json(med);
        } else {
            res.send(404);
        }
    }).catch(function (err) {
        console.error('Error occurred getting medication', err);
        res.send(500);
    });
};

exports.create = function (req, res) {
    req.body.d = {
        c: moment().toDate()
    }
    q(Medication.create(req.body)).then(function (med) {
        res.json(201, med);
    }).catch(function (err) {
        console.error('Error occurred creating medication', err);
        res.send(500);
    });
};

exports.update = function (req, res) {
    q.resolve().then(function () {
        req.body.d.m = moment().toDate();
        return q(Medication.findByIdAndUpdate(req.params.id, req.body).exec()).then(function (med) {
            if (!med) {
                res.send(404);
            } else {
                res.json(med);
            }
        });
    }).catch(function (err) {
        console.error('Error occurred updating medication', err);
        res.send(500);
    });
};

exports.destroy = function (req, res) {
    q(Medication.remove({ _id: req.params.id }).exec()).then(function (med) {
        if (!med) {
            res.send(404);
        } else {
            res.send(204);
        }
    }).catch(function (err) {
        console.error('Error occurred deleting medication', err);
        res.send(500);
    });
};
