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
    //init
    $scope.data = mock;
    $scope.games = $scope.data.games; //todo replace by http/file fetch or not
    $scope.gameKeys = Object.keys($scope.games);

    $scope.getGame = function(gameId){
        if(typeof gameId == 'number'){
            return $scope.games[$scope.gameKeys[gameId]];
        }else if(typeof gameId == 'string'){
            return $scope.games[gameId];
        }
    };

    $scope.setGame = function(gameId){
        $scope.currentGame = $scope.getGame(gameId);
    };


    $scope.currentGame = $scope.getGame(0); //init



});