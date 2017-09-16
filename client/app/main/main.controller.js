'use strict';

angular.module('medicationReminderApp').controller('MainCtrl', function ($scope, $http, $window) {

    $scope.$watch("datepicker", function(newValue, oldValue) {
        var start = moment(newValue).format('MM/DD/YYYY'),
            end = moment(newValue).add(1, 'day').format('MM/DD/YYYY');

        $http.get('/api/medications?start=' + start + '&end=' + end).then(function (meds) {
            $scope.meds = meds.data;
        });
    });

    var now = moment().add(5, 'minute').format('MM/DD/YYYY HH');
    $http.get('/api/medications?start=' + now + '&completed=0').then(function (meds) {
        $scope.mistMeds = meds.data;
    });

    $window.setInterval(function () {
        //Variable to have the current time format
        $scope.currentTimeBrut = moment().format('YYYYMMDDHHmm');
        managedNextMedication(moment());
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
        $http.put('/api/medications/' + medication._id, JSON.stringify(medication)).then(function (response) {
            if (response.status == 200)
            {
                //If this medication is the name medication we have to reset the next medication
                if ($scope.nextMed && response.data._id == $scope.nextMed._id)
                {
                    $scope.nextMed = null;
                }
            }
        });
    };

    function managedNextMedication(currentTime) {
        //Set nextMed if nextMed is null
        if (!$scope.nextMed)
        {
            $http.get('/api/medications/next_medication').then(function (nextMed) {
                $scope.nextMed = nextMed.data;
            });
        }

        if ($scope.nextMed)
        {
            var nextMedicationTime = moment($scope.nextMed.time);

            if (typeof $scope.nextMed != "undefined" && currentTime.diff(nextMedicationTime) >= 0 && currentTime.diff(nextMedicationTime) < 1000) {
                console.log('Alert 1');
            } else {
                nextMedicationTime.add(5, 'minute');
                if (typeof $scope.nextMed != "undefined" && currentTime.diff(nextMedicationTime) >= 0 && currentTime.diff(nextMedicationTime) < 1000) {
                    console.log('Alert 2');
                    //put this medication in the mist medication list
                    $scope.mistMeds.push($scope.nextMed);
                    //Set nextMed to null to reset next med
                    $scope.nextMed = null;
                }
            }
        }
    }
});
