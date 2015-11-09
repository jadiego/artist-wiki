var echoNestKey = "PQNZXJGBHUU5MMM5K";
var echoNestBase = "http://developer.echonest.com/api/v4/"
//Example: http://developer.echonest.com/api/v4/artist/blogs?api_key=PQNZXJGBHUU5MMM5K&id=ARH6W4X1187B99274F&format=json&results=1&start=0

var myApp = angular.module('myApp', ['spotify', 'firebase'])

$(document).ready(function(){
    $('[data-toggle="popover"]').popover(); 
});

myApp.controller('myCtrl', function($http, $scope, $firebaseAuth, $firebaseArray, $firebaseObject, Spotify) {
    
    /*============================FIREBASE=================================*/
    var ref = new Firebase("https://spotify-demo.firebaseio.com/");
    var userRef = ref.child("users");
    
    $scope.users = $firebaseObject(userRef);
    
    // SignUp function
    $scope.signUp = function() {
        // Create user
        $scope.authObj.$createUser({
            email: $scope.email,
            password: $scope.password,          
        })

        // Once the user is created, call the logIn function
        .then($scope.logIn)

        // Once logged in, set and save the user data
        .then(function(authData) {
            $scope.userId = authData.uid;
            $scope.users.$save()
        })

        // Catch any errors
        .catch(function(error) {
            console.error("Error: ", error);
        });
    };

    // SignIn function
    $scope.signIn = function() {
        $scope.logIn().then(function(authData){
            $scope.userId = authData.uid;
        })
    };

    // LogIn function
    $scope.logIn = function() {
        $('.userModal').modal('hide')
        return $scope.authObj.$authWithPassword({
            email: $scope.email,
            password: $scope.password
        })
    };

    // LogOut function
    $scope.logOut = function() {
        $scope.authObj.$unauth()
        $scope.userId = false
    };
    
    // Create authorization object that refers to firebase
    $scope.authObj = $firebaseAuth(ref);
    
    /*=====================================================================*/
    
    
    /*=============================SPOTIFY=================================*/
    
    $scope.submitSearch = function(name) {
        
        //Search artist's name, stores artist, including artist ID
        Spotify.search(name, 'artist').then(function(data) {
            $scope.artist = data.artists.items[0];
            console.log($scope.artist);
            $scope.artistImg = $scope.artist.images[0].url;
            $scope.genres = $scope.artist.genres;
        })
        
        //Uses artist ID and search top tracks and other information
        .then(function() {
            Spotify.getArtistTopTracks($scope.artist.id, 'US').then(function(data) {
                $scope.topTen = data.tracks;
            });
            
            Spotify.getRelatedArtists($scope.artist.id).then(function(data) {
                $scope.similarArtists = data.artists;
            });
            
            //Have to call getAlbum twice because second call gets full object, not simplified.
            Spotify.getArtistAlbums($scope.artist.id, {album_type:'album', country : 'MX'}).then(function(data) {
                var IDArray = data.items.map(function (element) { return element.id; });
                Spotify.getAlbums(IDArray).then(function(response) {
                    $scope.artistAlbums = response.albums;
                    console.log($scope.artistAlbums);
                })
            })
            
            //Gets additional information from Echo Nest
            $http.get(echoNestBase + "artist/search", {params: {
                api_key: echoNestKey,
                name: $scope.artist.name,
                bucket: ['news', 'genre', 'reviews']
            }})
             
            .success(function(data) {
                $scope.news = data.response.artists[0].news;
                console.log($scope.news)
                $scope.reviews = data.response.artists[0].reviews;
                console.log($scope.reviews)
            });
        });
        
    };
    
    $scope.audioObject = {}
    
    //Plays 30 second preview of given track
    $scope.play = function(track) {
        if($scope.currentSong == track) {
            $scope.audioObject.pause()
            $scope.currentSong = false
            return
        }
        else {
            if($scope.audioObject.pause != undefined) $scope.audioObject.pause()
            $scope.audioObject = new Audio(track);
            $scope.audioObject.play()  
            $scope.currentSong = track
        }
    };
    
    /*=====================================================================*/
});