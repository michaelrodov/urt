/**
 * Created by Carlos on 29/06/2015.
 *
 */
var dashApp = angular.module('dashApp', ['ngMaterial'])
				.config(function($mdThemingProvider) {
					  $mdThemingProvider.theme('default')
						.primaryPalette('blue-grey')
					});
					
dashApp.controller('dashCtrl', function($scope, $http, $interval, $mdToast) {

    $scope.getSortOrder = function(player) {
        if(player.type === 0){
            if(player[$scope.orderColumn].type === "number"){
                return ($scope.orderColumnDirection) ? 9999 : -9999;
            }else{
                return ($scope.orderColumnDirection) ? "zzzzzz" : "_______a";
            }
        }else{
            return player[$scope.orderColumn];
        }
    }

    $scope.setSortOrderColumn = function(column){
        if($scope.orderColumn == column){
            ($scope.orderColumnDirection) ? $scope.orderColumnDirection=false : $scope.orderColumnDirection=true;
        }else{
            $scope.orderColumn = column;
            $scope.orderColumnDirection = false;
        }
    }

    //init
    $scope.data = mock;
    $scope.currentGame = null;
    $scope.games = $scope.data.games; //todo replace by http/file fetch or not
    $scope.gameKeys = Object.keys($scope.games);
    $scope.orderColumn = "name"; //by which field to order the table
    $scope.orderColumnDirection = false;

    $scope.getGame = function(gameId){
        if(typeof gameId == 'number'){
            return $scope.games[$scope.gameKeys[gameId]];
        }else if(typeof gameId == 'string'){
            return $scope.games[gameId];
        }
    }

    $scope.enrichGame = function(game){
        var thisGame = game;
        for(var i=0; i<thisGame.players.length; i++ ){
            if(thisGame.players[i].type !==0) {
                thisGame.players[i].ratio = Math.round((thisGame.players[i].kills / thisGame.players[i].deaths)*100)/100;
                thisGame.players[i].rating = 0;
            }else{
                thisGame.players[i].ratio = {value:"RATIO", type:"number"};
                thisGame.players[i].rating = {value:"RATING", type:"number"};

            }
        }
        return thisGame;
    }

    $scope.setCurrentGame = function(key){
        $scope.currentGame = $scope.enrichGame($scope.getGame(key));
    }


    $scope.setCurrentGame(0); //init



});