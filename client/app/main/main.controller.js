'use strict';

angular.module('medicationReminderApp').controller('MainCtrl', function ($scope, $http, $window) {

    var start = moment().format('MM/DD/YYYY'),
        end = moment().add(1, 'day').format('MM/DD/YYYY');

    $http.get('/api/medications?start=' + start + '&end=' + end).then(function (meds) {
        $scope.meds = meds.data;
    });

    $window.setInterval(function () {
        //Variable to have the current time format
        $scope.currentTimeBrut = moment().format('YYYYMMDDHHmm');
        //Variable too signal the delay
        $scope.lessFiveMinutesTimeBrut = moment().subtract(5, 'minute').format('YYYYMMDDHHmm');
        //Variable too show complete button
        $scope.addFiveMinutesTimeBrut = moment().add(5, 'minute').format('YYYYMMDDHHmm');
        $scope.currentTime = moment().format('MMMM Do YYYY, h:mm:ss a');
        $scope.$apply();
    }, 1000);

    /**
     * @param medication
     *
     * To complete a medication, passe the boolean to true
     */
    $scope.completeMedication = function(medication) {
        //Remove useless key
        delete medication['$$hashKey'];
        medication.completed = true;
        $http.put('/api/medications/' + medication._id, JSON.stringify(medication));
    };
});
