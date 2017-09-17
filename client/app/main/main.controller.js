'use strict';

angular.module('medicationReminderApp').controller('MainCtrl', function ($scope, $http, $window) {
    Notification.requestPermission();

    $scope.datepicker = new Date();

    /**
     * If the date selected change we load the medication of this new date
     */
    $scope.$watch("datepicker", function(newValue, oldValue) {
        var start = moment(newValue).format('MM/DD/YYYY');
        var end = moment(newValue).add(1, 'day').format('MM/DD/YYYY');

        $http.get('/api/medications?start=' + start + '&end=' + end).then(function (meds) {
            $scope.meds = meds.data;
        });
    });

    /**
     * Load all mist medications
     */
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
            if (response.status == 200) {
                //If this medication is the name medication we have to reset the next medication
                if ($scope.nextMed && response.data._id == $scope.nextMed._id) {
                    $scope.nextMed = null;
                }
            }
        });
    };

    /**
     * We considerate that there is only one medication a time
     * @param currentTime
     */
    function managedNextMedication(currentTime) {
        //Set nextMed if nextMed is null
        if (!$scope.nextMed) {
            $http.get('/api/medications/next_medication').then(function (nextMed) {
                $scope.nextMed = nextMed.data;
            });
        }

        if ($scope.nextMed) {
            var nextMedicationTime = moment($scope.nextMed.time);

            if (currentTime.diff(nextMedicationTime) >= 0 && currentTime.diff(nextMedicationTime) < 1000) {
                showNotification($scope.nextMed, 1);
            } else {
                nextMedicationTime.add(5, 'minute');
                if (currentTime.diff(nextMedicationTime) >= 0 && currentTime.diff(nextMedicationTime) < 1000) {
                    showNotification($scope.nextMed, 2);
                    //put this medication in the mist medication list
                    $scope.mistMeds.push($scope.nextMed);
                    //Set nextMed to null to reset next med
                    $scope.nextMed = null;
                }
            }
        }
    }

    function showNotification(medication, levelImportance)  {
        if (medication) {
            if (levelImportance === 1) {
                var title = 'Don\'t forget to take your medication.';
                var audio = new Audio('../../assets/sounds/alert_1.wav');
            } else if (levelImportance === 2) {
                var title = 'You are late to take your medication...';
                var audio = new Audio('../../assets/sounds/alert_2.wav');
            }

            var body = moment(medication.time).format('hh:mm a') + ' ' + medication.name + ' - ' + medication.dosage;
            var icon = 'https://pbs.twimg.com/profile_images/557991410196951040/NN5BmXID.png';
            new Notification(title,{body:body,icon:icon});
            audio.play();
        }
    }
});
