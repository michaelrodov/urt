/**
 * Created by Carlos on 29/06/2015.
 *
 */
var BLUE = 0;
var RED = 1;
var TEAM_COLORS = ['blue', 'red'];
var EXCLUDED_PLAYERS = "OHAD,Shalom,Rachel,Bonev";

var dashApp = angular.module('dashApp', ['ngMaterial'])
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey')
            .accentPalette('blue')
            .backgroundPalette('red')
    })
    .directive('onNgrepeatEnd', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                   $timeout(function () {
                        scope.$emit('NGREPEAT-FINISHED');
                    });
                }
            }
        }
    });

dashApp.controller('dashCtrl', function ($scope, $http, $interval, $mdToast) {
    $scope.dataLoaded = false;

    $scope.Math = window.Math;

    $scope.refreshPowerPie = function (columns) {
        if($scope.powerPie){
            $scope.powerPie.load({columns: columns});
        }
    }

    $scope.$on("NGREPEAT-FINISHED", function(){
        $scope.dataLoaded = true;
    });

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
                show: false
            },
            size: {
                width: 600,
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


    $scope.extractPlayersLineDataRatio = function (games, gameKeys) {
        var playersLineData = [];
        var columnsArry =[];
        gameKeys.sort(function(a, b){
            a = parseInt(a.substring(0, a.indexOf("_")));
            b = parseInt(b.substring(0, b.indexOf("_")));
            if(a > b) return -1;
            if(a < b) return 1;
            return 0;
        });
        for (var i = 0; i < gameKeys.length; i++) {
            var playerKeys = Object.keys(games[gameKeys[i]].players);
            for (var j = 0; j < playerKeys.length; j++) {
                if(!playersLineData[playerKeys[j]]){
                    playersLineData[playerKeys[j]]=[playerKeys[j]];
                }
                playersLineData[playerKeys[j]].push($scope.getRatio(games[gameKeys[i]].players[playerKeys[j]]));
            }
        }
        playerKeys = Object.keys(playersLineData);
        columnsArry.push(['xAxis'].concat(gameKeys));
        for (var i = 0; i < playerKeys.length; i++) {
            columnsArry.push(playersLineData[playerKeys[i]]);

        }

        return columnsArry;
    }

    $scope.extractPlayersLineData = function (games, gameKeys) {
        var playersLineData = [];
        var columnsArry =[];
        gameKeys.sort(function(a, b){
            a = parseInt(a.substring(0, a.indexOf("_")));
            b = parseInt(b.substring(0, b.indexOf("_")));
            if(a > b) return -1;
            if(a < b) return 1;
            return 0;
        });
        for (var i = 0; i < gameKeys.length; i++) {
            var playerKeys = Object.keys(games[gameKeys[i]].players);
            for (var j = 0; j < playerKeys.length; j++) {
                if(!playersLineData[playerKeys[j]]){
                    playersLineData[playerKeys[j]]=[playerKeys[j]];
                }
                playersLineData[playerKeys[j]].push($scope.getGameGrade(games[gameKeys[i]].players[playerKeys[j]], games[gameKeys[i]]));
            }
        }
        playerKeys = Object.keys(playersLineData);
        columnsArry.push(['xAxis'].concat(gameKeys));
        for (var i = 0; i < playerKeys.length; i++) {
            columnsArry.push(playersLineData[playerKeys[i]]);

        }

        return columnsArry;
    }

    $scope.convertToArray = function (players,key) {
        var playersArr = [];
        for (var player in players) {
            if (key != "SUMMARY"){
                players[player].ratio = $scope.getRatio(players[player]);
                players[player].grade = $scope.getGrade(players[player]);
            } else {
                //players[player].grade = $scope.getGrade(players[player],-1);
            }
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

    $scope.getGameRatio = function (player) {
        if ((player.deaths + player.kills) == 0) return 0;
        return Math.round((player.kills / (player.deaths + player.kills)) * 100) / 100;
    }

    $scope.getRatio = function (player, totalKills) {
        if(!totalKills){
            //var totalKills = $scope.currentGame.gameTotalDeaths; //deaths = kills in total per game :)
            return $scope.getGameRatio(player);
        }
        for (var i = 0; i < $scope.playersTotalRatios.length; i++) {
            if ($scope.playersTotalRatios[i].name == player) {
                return $scope.playersTotalRatios[i].ratio;
            }
        }
        return 999999;
    }

    $scope.getGameGrade = function (player,game) {
        //grade = relative_score * relative_kills * efficiany * 100
        //relative_score = player_score / total_score
        //relative_kills = player_kills / total_kills
        //efficiancy = player_kills / player_kills + player_deaths
        var relative_kills = (game.gameTotalDeaths == 0 ? 0.01 : (Object.keys(game.players).length * player.kills / (2 * game.gameTotalDeaths)));
        var relative_score = 1;
        if (player.score != 0) {
            relative_score = (game.gameTotalScore == 0 ? 0.01 : (Object.keys(game.players).length * player.score / (2 * game.gameTotalScore)));
        } else {
            relative_score = relative_kills;
        }
        //(x == 2 ? "yes" : "no");
        relative_score = (isNaN(relative_score)? 0:relative_score);
        relative_kills = (isNaN(relative_kills)? 0:relative_kills);
        var totalGrade = Math.round((relative_kills + relative_score + (isNaN($scope.getRatio(player))? 0:$scope.getRatio(player))) * 3000) / 100;
        return totalGrade ;
    }

    /***
     * Final function
     * @param player
     * @returns {number}
     */
    $scope.getGrade = function (player, totalKills) {
        if(!totalKills){
            //var totalKills = $scope.currentGame.gameTotalDeaths; //deaths = kills in total per game :)
            return $scope.getGameGrade(player,$scope.currentGame);
        }
        for (var i = 0; i < $scope.playersTotalGrades.length; i++) {
            if ($scope.playersTotalGrades[i].name == player) {
                return $scope.playersTotalGrades[i].grade;
            }
        }
        return 999999;
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
        return {background: "linear-gradient(to right, lavender 0%,lavender " + Math.round((value/$scope.currentGame.maxGrade)*100) + "%,white " + Math.round((value/$scope.currentGame.maxGrade)*100) + "%,white 100%)"};
    }

    $scope.setCurrentGame = function (key) {
        $scope.currentGame = $scope.getGame(key);
        $scope.currentGame.columns = [[TEAM_COLORS[BLUE], 0], [TEAM_COLORS[RED], 0]]; //init teams
        $scope.playersKeys = Object.keys($scope.currentGame.players);
        $scope.playersArray = $scope.convertToArray($scope.currentGame.players,key)
        $scope.currentGame.maxGrade = $scope.playersArray[0].grade; //TODO do it in more general way
        $scope.initIncluded($scope.currentGame);
        $scope.buildTeams($scope.currentGame);

        $scope.powerPie = $scope.generatePowerPie($scope.currentGame.columns);

    }

    $scope.initIncluded = function (game) {
        var players = Object.keys(game.players);
        var gameMaxScore = 0;
        for (var i = 0; i < players.length; i++) {
            (typeof game.players[players[i]].include !== 'boolean') ? game.players[players[i]].include = (EXCLUDED_PLAYERS.indexOf(game.players[players[i]].name)<0)?true:false : '';
        }
    }

    //init
    $scope.buildTeams = function (game) {
        $scope.currentGame.columns = [[TEAM_COLORS[BLUE], 0], [TEAM_COLORS[RED], 0]]; //init teams
        for (var i = 0; i < $scope.playersArray.length; i++) {
            var player = game.players[$scope.playersArray[i].name];
            if (player.include) {
                if ($scope.compareTeams() >= 0) { //blue bigger
                    player.team = TEAM_COLORS[RED];
                } else {
                    player.team = TEAM_COLORS[BLUE];
                }
                $scope.addToTeam(player);
            }
        }
        $scope.refreshPowerPie($scope.currentGame.columns);
    }

    $scope.calcPlayerRatio = function (data) {
        var dataV = data;
        var playerRatios = [];
        for (var i = 1; i < dataV.length; i++) {
            var playerData = dataV[i];
            var playerName = playerData[0];
            var weightSum = 0;
            var gradeSum = 0;
            for (var j = 1; j < playerData.length; j++) {
                var weight = 0; //for all historical games no calc
                if (j < 2) {
                    weight = 10;
                } else if (j < 4) {
                    weight = 8;
                } else if (j < 6) {
                    weight = 4;
                }
                weightSum += weight;
                gradeSum += weight * parseFloat(playerData[j]);
            }
            var player = {};
            player.name = playerName;
            if (weightSum > 0) {
                var tempGrade = gradeSum / weightSum;
                player.ratio = Math.round(tempGrade*200)/100;
            } else {
                player.ratio = 1;
            }
            playerRatios.push(player);
        }
        return playerRatios;
    }

    $scope.calcPlayerGrade = function (data) {
        var dataV = data;
        var playerGrades = [];
        for (var i = 1; i < dataV.length; i++) {
            var playerData = dataV[i];
            var playerName = playerData[0];
            var weightSum = 0;
            var gradeSum = 0;
            for (var j = 1; j < playerData.length; j++) {
                var weight = 0; //for all historical games no calc
                if (j < 3) {
                    weight = 10;
                } else if (j < 6) {
                    weight = 8;
                } else if (j < 12) {
                    weight = 4;
                }
                weightSum += weight;
                gradeSum += weight * parseInt(playerData[j]);
            }
            var player = {};
            player.name = playerName;
            if (weightSum > 0) {
                var tempGrade = gradeSum / weightSum;
                player.grade = Math.round(tempGrade*100)/100;
            } else {
                player.grade = 10;
            }
            playerGrades.push(player);
        }
        return playerGrades;
    }

    $scope.fillSummaryGrade = function (games, playerGrades) {
        var players = games["SUMMARY"].players;
        for (var i = 0; i < Object.keys(players).length; i++) {
            var playerName = Object.keys(players)[i];
            players[playerName].grade = $scope.getGrade(playerName,-1);
        }
    }

    $scope.fillSummaryRatio = function (games, playerRatios) {
        var players = games["SUMMARY"].players;
        for (var i = 0; i < Object.keys(players).length; i++) {
            var playerName = Object.keys(players)[i];
            for (var j = 0; j < playerRatios.length; j++) {
                if (playerRatios[j].name == playerName) {
                    players[playerName].ratio = playerRatios[j].ratio;
                }
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
            $scope.playersTotalGrades = $scope.calcPlayerGrade($scope.playersColumnsOverGames);
            $scope.fillSummaryGrade($scope.games,$scope.playersTotalGrades);
            $scope.playersColumnsOverGames = $scope.extractPlayersLineDataRatio($scope.games, $scope.gameKeys);
            $scope.playersTotalRatios = $scope.calcPlayerRatio($scope.playersColumnsOverGames);
            $scope.fillSummaryRatio($scope.games,$scope.playersTotalRatios);

            //$scope.generatePlayersLinechart($scope.playersColumnsOverGames);
            $scope.setCurrentGame('SUMMARY'); //init
        }
    );

    $scope.getGamesOrder = function (key) {
        return (key=='SUMMARY')?9999999:parseInt(key.substr(0,key.indexOf('_')));
    }


});