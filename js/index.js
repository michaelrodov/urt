/**
 * Created by Carlos on 29/06/2015.
 *
 */
var dashApp = angular.module('dashApp', ['ngMaterial'])
				.config(function($mdThemingProvider) {
					  $mdThemingProvider.theme('default')
						.primaryPalette('yellow')
					});
					
dashApp.controller('dashCtrl', function($scope, $http, $interval, $mdToast) {
	
	var REFRESH_RATE_SEC = 10;
	var linearBackoff = 0;
	var linearBackoffCycle = 3;
	var AUTH_RATE = 300;
	$scope.authenticateIn=300;
	$scope.determinateValue = 0;
	$scope.maxValue = REFRESH_RATE_SEC;
	$scope.runPermited = true;
	$scope.notification_class = "notification_hidden";
    //init
    $scope.data = [];
    $scope.data.push({name:"agm", users: "0", title: "Agile Manager", logo: "img/agm.png",gaid: "ga:59215255"});
    $scope.data.push({name:"saw", users: "0", title: "Service Anywhere", logo: "img/saw.png",gaid: "ga:85914404"});
    $scope.data.push({name:"srl", users: "0", title: "StormRunner Load", logo: "img/srl.png",gaid: "ga:87422827"});
    $scope.data.push({name:"appm", users: "0", title: "AppPulse Mobile", logo: "img/appm.png",gaid: "ga:71897204"});
    $scope.data.push({name:"ma", users: "0", title: "MyAccount", logo: "img/grey-HP-logo.png",gaid: "ga:81002014"});
	 

    $scope.refresh = function() {
		if($scope.runPermited){
			for (var i = 0, len = $scope.data.length; i < len; i++) {
				getRTUsers($scope.data[i]);
			}
        }
    }
	
	/*refresh every second*/
    $interval(function(){
		if($scope.determinateValue>99){
			$scope.determinateValue=0; 
			$scope.refresh();
		}
		if((linearBackoff--) < 1) {
			if($scope.runPermited) {
				$scope.determinateValue += Math.round(100 / REFRESH_RATE_SEC);
			}
		}
	}, 1000);

	function getRTUsers(item) {
			//try to refresh only after GAPI client is available
			if(gapi.client.analytics == null){
				return;
			}
			
			$http.get("https://www.googleapis.com/analytics/v3/data/realtime?metrics=rt%3AactiveUsers&ids="+item.gaid+"&key="+apiKey+"&access_token="+authentication.access_token)
				.success(function(data, status) {
					$scope.hideAlertToast();
					$scope.setDataValueByGaid(item.gaid,data.rows.pop().toString());
					linearBackoff=0; //in case of success, refresh period REFRESH_RATE_SEC
					linearBackoffCycle=1;
				})
				.error(function(data, status){
					$scope.showErrorToast("HTTP " + data.error.code + " " + data.error.message);
					//in case of error, refresh time is backed off
					// multiplies by REFRESH_RATE_SEC*linearBackoff * 0/1/2/3
					// i.e. first error refresh rate = 0s, second = 60s, third is 120s etc
					// in case error is 403 (access denied) stop sending requests
					if(status != "403") {
						linearBackoff = (linearBackoffCycle++ % 4) * 6;
					}
					else{
						$scope.setRunPermited(false);
					}
					return;
				});

			/*
			 gapi.client.analytics.data.realtime.get ({
				'ids': item.gaid,
				'metrics': 'rt:activeUsers'
			  }).then(function(handleAuthResult) {
				var maFormattedJson = JSON.stringify(handleAuthResult.result, null, 2);
				var maJsonParse = JSON.parse(maFormattedJson);
			     if(maJsonParse.rows==null){
					$scope.setDataValueByGaid(maJsonParse.query.ids, "0");
				 }
				else{
					$scope.setDataValueByGaid(maJsonParse.query.ids, maJsonParse.rows[0][0]);
				}
			  });
			*/  
		  }
		  
	$scope.setDataValueByGaid = function(gaid, users){
		var i=0;
		while($scope.data[i].gaid != gaid && i<$scope.data.length){
			i++;
		}
		if(i<$scope.data.length){
			$scope.data[i].users = users;
		}
	}	
	

	$scope.showErrorToast = function(message) {
		$scope.notification = message;
		$scope.notification_class = "notification_visible notification_error";
	}

	$scope.showWarningToast = function(message) {
		$scope.notification = message;
		$scope.notification_class = "notification_visible notification_warning";
	}

	$scope.showInfoToast = function(message) {
		$scope.notification = message;
		$scope.notification_class = "notification_visible notification_info";
	}
	
	$scope.hideAlertToast = function() {
		$scope.notification = "";
		$scope.notification_class = "notification_hidden";
	}
	
	$scope.setRunPermited = function(status){
		if(status === true){
			$scope.hideAlertToast(); //in any case if run is permitted remove the warning/error toast
			$scope.runPermited = true;
		}
		else{
			$scope.runPermited = false;
		}
	}

});