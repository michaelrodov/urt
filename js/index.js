/**
 * Created by Carlos on 29/06/2015.
 *
 */
var BLUE = 0;
var RED = 1;
var TEAM_COLORS = ['blue', 'red'];

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
    $scope.convertToArray = function (players) {
        var playersArr = [];
        for (var player in players) {
            players[player].ratio = $scope.getRatio(players[player]);
            players[player].grade = $scope.getGrade(players[player]);
            playersArr.push(players[player]);
        }
        return playersArr;
    }

    $scope.getSortOrder = function (val) {
        if (typeof $scope.currentGame.players[$scope.playersKeys[0]][$scope.orderColumn] === 'number') {
            return ($scope.orderColumnDesc) ? 999999 : -999999;
        } else {
            return ($scope.orderColumnDesc) ? "zzzzzz" : "_______a";
        }

    }

    $scope.setSortOrderColumn = function (column, enabled) {
        if (enabled) {
            /*if we want to order by column  that is already an ordering column, change direction*/
            if ($scope.orderColumn == column) {
                ($scope.orderColumnDesc) ? $scope.orderColumnDesc = false : $scope.orderColumnDesc = true;
            } else { /*else set the new ordering column*/
                $scope.orderColumn = column;
                $scope.orderColumnDesc = true;
            }
        }
        console.info("col:" + $scope.orderColumn + ", desc:" + $scope.orderColumnDesc);
    }

    $scope.getRatio = function (player) {
        return Math.round((player.kills / (player.deaths + player.kills)) * 100) / 100;
    }

    $scope.getTotalKills = function (game) {
        var playersKeys = Object.keys(game.players);
        var totalKills = 0;
        for (var i = 0; i < playersKeys.length; i++) {
            totalKills += game.players[playersKeys[i]].kills;
        }

        return totalKills;
    }

    /***
     * Final function
     * @param player
     * @returns {number}
     */
    $scope.getGrade = function (player) {
        return Math.round((5 + $scope.getRatio(player) * ((100 * player.kills) / $scope.totalKills)) * 100) / 100;
    }

    $scope.addToTeam = function (player) {
        $scope.currentGame.columns[(player.team == TEAM_COLORS[BLUE]) ? BLUE : RED][1] += $scope.getGrade(player);
        //TODO make a better managing of
    }

    /***
     * The function runs after the value was already changed. Therefore we will add to current team and will substruct from teh other team
     * @param name
     */
    $scope.playerToggleTeam = function (name) {
        var player = $scope.currentGame.players[name];
        console.info(player.name + " onChange with: " + player.team);
        /*Since this function is called after the change was made, the team relation should be opposite from the logic
         * i.e. new team = toTeam, old team = fromTeam*/
        var toTeam = ((player.team == TEAM_COLORS[BLUE]) ? BLUE : RED);
        var fromTeam = Math.abs(toTeam - 1);
        var rating = $scope.getGrade(player);

        $scope.currentGame.columns[fromTeam][1] -= rating;
        $scope.currentGame.columns[toTeam][1] += rating;
        $scope.refreshPowerPie($scope.currentGame.columns);
    }

    $scope.getPlayersTeam = function (playerIndex) {

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
        $scope.totalKills = $scope.getTotalKills($scope.currentGame);
        $scope.currentGame.columns = [[TEAM_COLORS[BLUE], 0], [TEAM_COLORS[RED], 0]]; //init teams
        $scope.buildTeams($scope.currentGame);
        $scope.playersKeys = Object.keys($scope.currentGame.players);
        $scope.powerPie = $scope.generatePowerPie($scope.currentGame.columns);
        $scope.playersArray = $scope.convertToArray($scope.currentGame.players)
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
            $scope.orderColumn = "grade"; //by which field to order the table
            $scope.orderColumnDesc = true;


            $scope.setCurrentGame(0); //init
        }
    );

});