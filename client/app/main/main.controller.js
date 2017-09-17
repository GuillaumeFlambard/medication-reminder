'use strict';

angular.module('medicationReminderApp').controller('MainCtrl', function ($scope, $http, $window) {
    //Request permission for browser's notifications
    Notification.requestPermission();
    //Default date
    $scope.datepicker = new Date();
    //Allow to add minutes in order to test notifications
    var additionalTime = 0;

    /**
     * If the selected date changes we load the medication of the new date
     */
    $scope.$watch("datepicker", function(newValue, oldValue) {
        var start = moment(newValue).format('MM/DD/YYYY');
        var end = moment(newValue).add(1, 'day').format('MM/DD/YYYY');

        $http.get('/api/medications?start=' + start + '&end=' + end).then(function (meds) {
            $scope.meds = meds.data;
        });
    });

    /**
     * Load all missed medications
     */
    var nowAddFiveMinutes = moment().add(additionalTime, 'minute').subtract(5, 'minute').format('MM/DD/YYYY HH:mm:ss');
    $http.get('/api/medications?end=' + nowAddFiveMinutes + '&completed=0').then(function (meds) {
        $scope.missedMeds = meds.data;
    });

    $window.setInterval(function () {
        //Variable to get current time format
        $scope.currentTimeBrut = moment().add(additionalTime, 'minute').format('YYYYMMDDHHmmss');
        managedNextMedication(moment().add(additionalTime, 'minute'), 1);
        managedNextMedication(moment().add(additionalTime, 'minute'), 2);
        //Variable to report delay
        $scope.lessFiveMinutesTimeBrut = moment().add(additionalTime, 'minute').subtract(5, 'minute').format('YYYYMMDDHHmmss');
        //Variable to show the complete button
        $scope.addFiveMinutesTimeBrut = moment().add(additionalTime, 'minute').add(5, 'minute').format('YYYYMMDDHHmmss');
        $scope.currentTime = moment().add(additionalTime, 'minute').format('MMM Do YYYY, h:mm:ss a');
        $scope.$apply();
    }, 1000);

    /**
     * @param medication
     *
     * To complete a medication, pass the boolean to true
     */
    $scope.completeMedication = function(medication) {
        //Remove useless key
        delete medication['$$hashKey'];
        medication.completed = true;
        $http.put('/api/medications/' + medication._id, JSON.stringify(medication)).then(function (response) {
            if (response.status == 200) {
                //If next medication and this medication are the same, we have to reset the next medication (set null)
                if ($scope.nextMed && response.data._id == $scope.nextMed._id) {
                    $scope.nextMed = null;
                } else if ($scope.nextMedLevelTwo && response.data._id == $scope.nextMedLevelTwo._id) {
                    $scope.nextMedLevelTwo = null;
                }
            }
        });
    };

    /**
     * @param currentTime
     * @param level
     */
    function managedNextMedication(currentTime, level) {
        //If this is alert 2, we have to subtract 5 minutes
        if (level == 2) {
            currentTime.subtract(5, 'minute');
        }

        var currentTimeFormat = currentTime.format('MM/DD/YYYY HH:mm:ss');

        //Set nextMed if nextMed is null
        if ((!$scope.nextMed && level == 1) || (!$scope.nextMedLevelTwo && level == 2)) {
            $http.get('/api/medications/find_one?start=' + currentTimeFormat + '&completed=0').then(function (nextMed) {
                if (level == 1) {
                    $scope.nextMed = nextMed.data;
                } else {
                    $scope.nextMedLevelTwo = nextMed.data;
                }
            });
        }

        if (($scope.nextMed && level == 1) || ($scope.nextMedLevelTwo && level == 2)) {
            notificationRequest(currentTime, level);
        }
    }

    /**
     * In the case where you have many medications at the same time, the application makes
     * a request to get every medications
     * @param currentTime
     * @param level
     */
    function notificationRequest(currentTime, level) {
        if (level == 1) {
            var nextMedicationTime = moment($scope.nextMed.time);
        } else if (level == 2) {
            var nextMedicationTime = moment($scope.nextMedLevelTwo.time);
        }

        var nextMedicationTimeFormat = nextMedicationTime.format('MM/DD/YYYY HH:mm:ss');

        if (currentTime.diff(nextMedicationTime) >= 0 && currentTime.diff(nextMedicationTime) < 1000) {
            var nextMedicationTimeFormatPlusOneSec = nextMedicationTime.add(1, 'second').format('MM/DD/YYYY HH:mm:ss');
            $http.get('/api/medications?start=' + nextMedicationTimeFormat + '&end=' + nextMedicationTimeFormatPlusOneSec + '&completed=0').then(function (meds) {
                for (var i = 0; i < meds.data.length; i++)
                {
                    showNotification(meds.data[i], level);
                    if (level == 2) {
                        $scope.missedMeds.push(meds.data[i]);
                    }
                }
                playAlertSound(level);
                if (level == 1) {
                    $scope.nextMed = null;
                } else if (level == 2) {
                    $scope.nextMedLevelTwo = null;
                }
            });
        }
    }

    /**
     * @param medication
     * @param levelImportance
     */
    function showNotification(medication, levelImportance)  {
        if (medication) {
            if (levelImportance === 1) {
                var title = 'Don\'t forget to take your medication.';
            } else if (levelImportance === 2) {
                var title = 'You are late to take your medication...';
            }

            var body = moment(medication.time).format('hh:mm a') + ' ' + medication.name + ' - ' + medication.dosage;
            var icon = 'https://pbs.twimg.com/profile_images/557991410196951040/NN5BmXID.png';
            new Notification(title,{body:body,icon:icon});
        }
    }

    /**
     * @param levelImportance
     */
    function playAlertSound(levelImportance) {
        if (levelImportance === 1) {
            var audio = new Audio('../../assets/sounds/alert_1.wav');
        } else if (levelImportance === 2) {
            var audio = new Audio('../../assets/sounds/alert_2.wav');
        }
        audio.play();
    }
});
