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
            pie: {
                label: {
                    format: function (value, ratio, id) {
                        return d3.round(value, 1);
                    }
                }
            },
            size: {
                width: 200,
                height: 200
            },
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
    $scope.generatePlayersLinechart = function (columns) {
        return c3.generate({
            bindto: '#players-linechart-container',
            data: {
                x: 'xAxis',
                type: 'line',
                columns: columns
            },
            legend: {
                position: 'right'
            },
            size: {
                width: 700,
                height: 200
            },
            axis: {
                x: {
                    type: 'category' // this needed to load string x value
                }
            }
        });
    }
    var sortByGradeDesc = function (playerA, playerB) {
        return playerB.grade - playerA.grade;
    }
    $scope.extractPlayersLineData = function (games, gameKeys) {
        var playersLineData = [];
        var columnsArry =[];
        for (var i = 1; i < gameKeys.length; i++) {
            var playerKeys = Object.keys(games[gameKeys[i]].players);
            for (var j = 0; j < playerKeys.length; j++) {
                if(!playersLineData[playerKeys[j]]){
                    playersLineData[playerKeys[j]]=[playerKeys[j]];
                }
                playersLineData[playerKeys[j]].push($scope.getGrade(games[gameKeys[i]].players[playerKeys[j]], games[gameKeys[i]].gameTotalDeaths));
            }
        }
        playerKeys = Object.keys(playersLineData);
        columnsArry.push(['xAxis'].concat(gameKeys));
        for (var i = 0; i < playerKeys.length; i++) {
            columnsArry.push(playersLineData[playerKeys[i]]);

        }

        return columnsArry;
    }
    $scope.convertToArray = function (players) {
        var playersArr = [];
        for (var player in players) {
            players[player].ratio = $scope.getRatio(players[player]);
            players[player].grade = $scope.getGrade(players[player]);
            playersArr.push(players[player]);
        }
        playersArr.sort(sortByGradeDesc);
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

    /***
     * Final function
     * @param player
     * @returns {number}
     */
    $scope.getGrade = function (player, totalKills) {
        if(!totalKills){
            var totalKills = $scope.currentGame.gameTotalDeaths; //deaths = kills in total per game :)
        }
        return Math.round((5 + $scope.getRatio(player) * ((100 * player.kills) / totalKills)) * 100) / 100;
    }

    $scope.addToTeam = function (player) {
        $scope.currentGame.columns[(player.team == TEAM_COLORS[BLUE]) ? BLUE : RED][1] += $scope.getGrade(player);
        //TODO make a better managing of
    }
    $scope.compareTeams = function () {
        return $scope.currentGame.columns[BLUE][1] - $scope.currentGame.columns[RED][1];
    }
    $scope.removeFromTeam = function (player) {
        $scope.currentGame.columns[(player.team == TEAM_COLORS[BLUE]) ? BLUE : RED][1] -= $scope.getGrade(player);
    }

    /***
     * The function runs after the value was already changed. Therefore we will add to current team and will substruct from teh other team
     * @param name
     */
    $scope.playerToggleTeam = function (name, oneway) {
        var player = $scope.currentGame.players[name];

        console.info(player.name + " onChange with: " + player.team);
        /*Since this function is called after the change was made, the team relation should be opposite from the logic
         * i.e. new team = toTeam, old team = fromTeam*/
        var toTeam = ((player.team == TEAM_COLORS[BLUE]) ? BLUE : RED);
        var fromTeam = Math.abs(toTeam - 1);
        var rating = $scope.getGrade(player);


        if (!oneway) {  //only for moving beween teams
            $scope.currentGame.columns[fromTeam][1] -= rating;
            $scope.currentGame.columns[toTeam][1] += rating;
        } else {
            if (player.include) { //only for include / exclude in teams count
                $scope.currentGame.columns[toTeam][1] += rating;
            }
            else {
                $scope.currentGame.columns[toTeam][1] -= rating;
            }
        }
        $scope.refreshPowerPie($scope.currentGame.columns);
    }


    $scope.getGame = function (gameId) {
        if (typeof gameId == 'number') {
            return $scope.games[$scope.gameKeys[gameId]];
        } else if (typeof gameId == 'string') {
            return $scope.games[gameId];
        }
    }

    $scope.getLineFillStyle = function (value) {
        return {background: "linear-gradient(to right, lavender 0%,lavender " + value * 4 + "%,white " + value * 4 + "%,white 100%)"};
    }

    $scope.setCurrentGame = function (key) {
        $scope.currentGame = $scope.getGame(key);
        $scope.currentGame.columns = [[TEAM_COLORS[BLUE], 0], [TEAM_COLORS[RED], 0]]; //init teams
        $scope.playersKeys = Object.keys($scope.currentGame.players);
        $scope.playersArray = $scope.convertToArray($scope.currentGame.players)

        $scope.initIncluded($scope.currentGame);
        $scope.buildTeams($scope.currentGame);

        $scope.powerPie = $scope.generatePowerPie($scope.currentGame.columns);

    }

    $scope.initIncluded = function (game) {
        var players = Object.keys(game.players);
        for (var i = 0; i < players.length; i++) {
            (typeof game.players[players[i]].include !== 'boolean') ? game.players[players[i]].include = true : '';
        }
    }
    //init
    $scope.buildTeams = function (game) {
        for (var i = 0; i < $scope.playersArray.length; i++) {
            var player = game.players[$scope.playersArray[i].name];
            if (player.include) {
                if ($scope.compareTeams() > 0) { //blue bigger
                    player.team = TEAM_COLORS[RED];
                } else {
                    player.team = TEAM_COLORS[BLUE];
                }
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
            $scope.playersColumnsOverGames = $scope.extractPlayersLineData($scope.games, $scope.gameKeys);

            $scope.generatePlayersLinechart($scope.playersColumnsOverGames);
            $scope.setCurrentGame(0); //init
        }
    );

});