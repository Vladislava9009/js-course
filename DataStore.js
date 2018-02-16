const store = new Vuex.Store ({
  state: {
      mainData: null,
      postData: null,
      mainDataIsReady: false,
      postDataIsReady: false,
      
      currentSectionId: null,
      sectionInfo: null,
      sectionPosts: null,
      
      currentPostId: null,
      currentPostContent: null,
      currentPostReadme: [],
      
      emptyPost: [{
          head: "В работе...",
          pict: "./images/smile-03.gif",
          text: `К сожалению, материал еще не готов`
      }],
      
      user: null,
      usersList: null,
      messagesDate: null,
      messagesRef: null,
      messages: []
  },
  getters: {
    currentUserId: state => {
        return __user => {
            var userId = 'unknown'
            for ( var prop in state.usersList ) {
                if ( state.usersList [ prop ].provider === __user.provider &&
                    state.usersList [ prop ].email == __user.email &&
                    state.usersList [ prop ].name === __user.name ) {
                          userId = prop
                          break
                }
            }
            return userId
        }
    },
    dataIsReady:  state => state.mainDataIsReady && state.postDataIsReady,
    mainMenuReady: state => state.mainDataIsReady,
    sectionIdDefined:  state => ( state.currentSectionId !== null ),
    sectionIsReady:  state =>
          state.mainDataIsReady && state.postDataIsReady &&
                            state.currentSectionId !== null,
    mainMenuItems: state =>
          state.mainDataIsReady ?
          state.mainData.map ( item => item.name ) : [],
    sectionMenu: state => state.currentSectionId ? [
              { ico: 'description', clickHandler: "gotoAbout" },
              { ico: 'dashboard', clickHandler: "gotoDetails" }
            ] : null
  },
  mutations: {
    changeMessagesData: ( state, newMessagesDate ) => {
      if ( typeof newMessagesDate === "string" )
                          state.messagesDate = newMessagesDate
      else {
            var m = newMessagesDate.getMonth() + 1
            var d = newMessagesDate.getDate()
            var y = newMessagesDate.getFullYear()
            var __m = m < 10 ? "0" + m : m
            var __d = d < 10 ? "0" + d : d
            state.messagesDate = "" + y + '-' + __m + '-' + __d
      }
      if ( state.messagesRef ) state.messagesRef.off()
      state.messagesRef = firebase.database().ref ( 'message/' + state.messagesDate )
      state.messagesRef.on  ( 'value', snapshot => {
          var __messages = []
          var snap = snapshot.val()
          for ( var mess in snap ) {
              var __user = state.usersList [ snap [ mess ].user ]
              if ( __user )
                  __messages.push ({
                      user: {
                          name: __user.name,
                          photoURL: __user.photoURL
                      },
                      text: snap [ mess ].text
                  })
          }
          state.messages = __messages
      })
    },
    setCurrentUser: ( state, newUser ) => {
        state.user = {
            name: newUser.displayName,
            email: newUser.email,
            provider: newUser.providerData[0].providerId,
            photoURL: newUser.photoURL,
            phoneNumber: newUser.phoneNumber,
            lastSignInTime: newUser.phoneNumber
        }
    },
    getCurrentUserId: state => {
        var userExist = false
        for ( var prop in state.usersList ) {
            if ( state.usersList [ prop ].provider === state.user.provider &&
                 state.usersList [ prop ].email == state.user.email &&
                 state.usersList [ prop ].name === state.user.name ) {
                            userExist = true
                            break
            }
        }
        if ( !userExist ) {
            var ref = firebase.database().ref ( "users" )
            ref.push ( state.user )
        }
    },
    saveUsersList: ( state, ul ) => {
        state.usersList = ul
        firebase.database().ref( "users" ).on( 'value', snapshot => {
            state.usersList = snapshot.val()
        })
    },
    
    userLoginError: state => {
        state.user = null
    },
    userLogOut: state => {
        state.user = null
    },
    
    changeCurrentSectionId: ( state, sectionId ) => {
        if ( sectionId === 'about' || sectionId === 'details' )
              state.sectionMenuSelected = sectionId
        else {
          state.currentSectionId = sectionId
        }
    },
    getCurrentSectionInfo: state => {
      if ( !state.mainData ) return
      state.sectionInfo = state.mainData.filter ( item =>
                          item.name === state.currentSectionId )[0]
    },
    getCurrentSectionPosts: state => {
      if ( !state.postData || !state.currentSectionId ) return null
      state.sectionPosts = state.postData [ state.currentSectionId ]
    },
    setCurrentPostId: ( state, postId ) => {
      state.currentPostId = postId
    },
    getMainData: ( state, mainData ) => {
        state.mainData = mainData
        state.mainDataIsReady = true
        state.mainMenuOptions = mainData.map ( item => item.name )
    },
    getPostData: ( state, postData ) => {
        state.postData = postData
        state.postDataIsReady = true
    }
  },
  actions: {
    getAllUsers: context => {
        var usersRef = firebase.database().ref ( "users" )
        usersRef.once ( "value" )
            .then ( function ( snapshot ) {
                context.commit ( 'saveUsersList', snapshot.val() )
            })
    },
    registerUser: ( context, newUser ) => {
        context.commit ( 'setCurrentUser', newUser )
        var testDB = new Promise ( function ( resolve, reject ) {
            if ( context.state.usersList ) resolve ( context.state.usersList )
        })
        testDB.then ( function ( res ) {
            context.commit ( 'getCurrentUserId' )
        })
    }
  }
})
