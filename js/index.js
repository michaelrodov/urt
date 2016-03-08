/**
 * Created by Carlos on 29/06/2015.
 *
 */
var BLUE = 0;
var RED = 1;
var TEAM_COLORS = ['blue','red'];

var dashApp = angular.module('dashApp', ['ngMaterial'])
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey')
            .accentPalette('blue')
            .backgroundPalette('red')
    });

dashApp.controller('dashCtrl', function ($scope, $http, $interval, $mdToast) {

    $scope.refreshPowerPie = function (columns) {
        $scope.powerPie.load({columns: columns});
    }

    $scope.generatePowerPie = function (columns) {
        return c3.generate({
            bindto: '#power-pie-container',
            data: {
                colors: {
                    red: '#FF0000',
                    blue: '#0000FF'
                },
                columns: columns,
                type: 'pie'
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

    $scope.addToTeam = function (player) {
        $scope.currentGame.columns[(player.team == TEAM_COLORS[BLUE]) ? BLUE : RED][1] += $scope.getRating(player);
        //TODO make a better managing of
    }

    $scope.playerToggleTeam = function (name) {
        //todo maybe just -1 abs toggle?
        var player = $scope.currentGame.players[name];
        console.info(player.name+":"+player.team);
        var fromTeam = ((player.team == TEAM_COLORS[BLUE]) ? BLUE : RED);
        var toTeam = Math.abs(fromTeam-1);
        var rating = $scope.getRating(player);

        $scope.currentGame.columns[fromTeam][1] -= rating;
        $scope.currentGame.columns[toTeam][1] += rating;
        $scope.refreshPowerPie($scope.currentGame.columns);
    }

    $scope.getPlayersTeam = function(playerIndex){

    }
    $scope.getGame = function (gameId) {
        if (typeof gameId == 'number') {
            return $scope.games[$scope.gameKeys[gameId]];
        } else if (typeof gameId == 'string') {
            return $scope.games[gameId];
        }
    }


    $scope.setCurrentGame = function (key) {
        $scope.currentGame = $scope.getGame(key);
        $scope.currentGame.columns = [[TEAM_COLORS[BLUE], 0], [TEAM_COLORS[RED], 0]]; //init teams
        $scope.buildTeams($scope.currentGame);
        $scope.playersKeys = Object.keys($scope.currentGame.players);

        $scope.powerPie = $scope.generatePowerPie($scope.currentGame.columns);
    }

    //init
    $scope.buildTeams = function (game) {
        var players = Object.keys(game.players);
        for (var i = 0; i < players.length; i++) {
            var player = game.players[players[i]];
            if (i % 2 == 0) {
                player.team = TEAM_COLORS[RED];
                $scope.addToTeam(player);

            } else {
                player.team = TEAM_COLORS[BLUE];
                $scope.addToTeam(player);
            }
        }
    }

    $http.get('DATA/games.json').success(
        function (data) {
            $scope.currentGame = null;
            $scope.powerPie;

            $scope.data = data;
            $scope.games = $scope.data.games; //todo replace by http/file fetch or not
            $scope.gameKeys = Object.keys($scope.games);
            $scope.orderColumn = "name"; //by which field to order the table
            $scope.orderColumnDirection = false;


            $scope.setCurrentGame(0); //init
        }
    );

});