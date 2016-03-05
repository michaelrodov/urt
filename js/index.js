/**
 * Created by Carlos on 29/06/2015.
 *
 */
var dashApp = angular.module('dashApp', ['ngMaterial'])
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey')
            .accentPalette('blue')
            .backgroundPalette('red')
    });

dashApp.controller('dashCtrl', function ($scope, $http, $interval, $mdToast) {

    $scope.refreshPowerPie = function(columns){
        $scope.powerPie.load({columns: columns});
    }

    $scope.generatePowerPie = function(columns){
        return c3.generate({
            bindto: '#power-pie-container',
            data: {
                colors: {
                    red: '#FF0000',
                    blue: '#0000FF'
                },
                columns: columns,
                type : 'pie'
            }
        });
    }

    $scope.getSortOrder = function (player) {
        if (player.type === 0) {
            if (player[$scope.orderColumn].type === "number") {
                return ($scope.orderColumnDirection) ? 999999 : -999999;
            } else {
                return ($scope.orderColumnDirection) ? "zzzzzz" : "_______a";
            }
        } else {
            return player[$scope.orderColumn];
        }
    }

    $scope.setSortOrderColumn = function (column, enabled) {
        if (enabled) {
            if ($scope.orderColumn == column) {
                ($scope.orderColumnDirection) ? $scope.orderColumnDirection = false : $scope.orderColumnDirection = true;
            } else {
                $scope.orderColumn = column;
                $scope.orderColumnDirection = false;
            }
        }
    }

    $scope.getRatio = function (player) {
        return Math.round((player.kills / ((player.deaths > 0) ? player.deaths : 1)) * 100) / 100;
    }

    $scope.getRating = function (player) {
        return Math.round(player.score * $scope.getRatio(player));
    }

    /*    $scope.updateCurrentGame = function(player){
     for($scope.currentGame
     }*/
    $scope.playerAddTeam = function (player) {
        $scope.currentGame.columns[(player.team == "blue") ? BLUE : RED][1] += $scope.getRating(player);
        $scope.refreshPowerPie($scope.currentGame.columns);

    }

    $scope.playerToggleTeam = function (player) {
        //todo maybe just -1 abs toggle?
        var fromTeam = (player.team == "blue") ? BLUE : RED;
        $scope.currentGame.columns[fromTeam][1] -= $scope.getRating(player);
        $scope.currentGame.columns[(fromTeam == "blue") ? RED : BLUE][1] += $scope.getRating(player);
        player.team = fromTeam=="blue"?"red":"blue"; //update the data struct
        $scope.refreshPowerPie($scope.currentGame.columns);
    }

    //init

    $scope.data = mock;
    $scope.currentGame = null;
    $scope.powerPie;
    var RED = 0;
    var BLUE = 1;

    $scope.games = $scope.data.games; //todo replace by http/file fetch or not
    $scope.gameKeys = Object.keys($scope.games);
    $scope.orderColumn = "name"; //by which field to order the table
    $scope.orderColumnDirection = false;

    $scope.getGame = function (gameId) {
        if (typeof gameId == 'number') {
            return $scope.games[$scope.gameKeys[gameId]];
        } else if (typeof gameId == 'string') {
            return $scope.games[gameId];
        }
    }

    $scope.enrichGame = function (game) {
        var thisGame = game;
        for (var i = 0; i < thisGame.players.length; i++) {
            if (thisGame.players[i].type !== 0) {
                thisGame.players[i].ratio = Math.round((thisGame.players[i].kills / thisGame.players[i].deaths) * 100) / 100;
                thisGame.players[i].rating = 0;
            } else {
                thisGame.players[i].ratio = {value: "RATIO", type: "number"};
                thisGame.players[i].rating = {value: "RATING", type: "number"};

            }
        }
        return thisGame;
    }

    $scope.setCurrentGame = function (key) {
        $scope.currentGame = $scope.enrichGame($scope.getGame(key));
        $scope.currentGame.columns = [['red', 0], ['blue', 0]];
        $scope.powerPie = $scope.generatePowerPie($scope.currentGame.columns);
    }


    $scope.setCurrentGame(0); //init


});