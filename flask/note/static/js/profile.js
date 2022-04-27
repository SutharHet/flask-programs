$(document).ready(() => {
  user = ""
  token = ''
  $("#save").css("display","none")
  
  let userData = {}

  let getCookie = (cname) => {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  let getUser = () => {
    let obj ={
      type: "GET",
      url: "/users",
      headers: {
        'x-access-tokens': token
      },
      success: (userData) => {
        $("#profile span").html(userData.username.charAt(0).toUpperCase())
        $("#profile-pic span").html(userData.username.charAt(0).toUpperCase())
        $("#username").val(userData.username)
        $("#password").val(userData.password)
        $("#email").val(userData.email)
        $("#mobile-no").val(userData.mobile_no)
        if(userData.birthdate != null ){
          let dates =  new Date(userData.birthdate)
          $("#day").val(dates.getDate())
          $("#month").val(dates.getMonth() + 1)
          $("#year").val(dates.getFullYear())
        }
      },
      error: () => {
        console.log("Error getting user data")
      }
    }
    // console.log(token)
    $.ajax(obj)
  }
  $("#profile-data input").attr("disabled", true)

  let checkCookie = () => {
    token = getCookie("noteToken");
    if (token != "") {
      getUser()   
    } else {
      window.location.replace("http://127.0.0.1:5000/login")  
    }
  }

  checkCookie()

  $("#edit").click(()=>{
    $("#profile-data input").attr("disabled", false)
    $("#save").css("display","block")
    $("#edit").css("display","none")
  })
  
  $("#save").click(()=>{
    let user = $("#username").val()
    let password = $("#password").val()
    let email = $("#email").val()
    let mno = $("#mobile-no").val()
    let day = parseInt($("#day").val())
    let month = parseInt($("#month").val())
    let year = parseInt($("#year").val())
    
    let data = {
      ...userData,
      username: user,
      password: password,
      email: email,
    }  

    delete data.user_Id
    
    if(mno != '' && mno.length >= 10 ){
      data.mobile_no = mno
    }

    if(day > 0 && month > 0 && year > 0){
      try {
        let date = new Date(year, month-1, day)
        data.birthdate = year+"-"+month+"-"+day
      }
      catch(err){
        console.log("Invalid Date")
      }
    }

    let obj = {
      type: "PUT",
      url: "/users",
      headers: {
        'x-access-tokens': token
      },
      data: data,
      success: () => {
        getUser()
      },
      error: () => {
        console.log("Err updating user data")
      }
    }
    
    $.ajax(obj)

    $("#profile-data input").attr("disabled", true)
    $("#save").css("display","none")
    $("#edit").css("display","block")
  })

  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/dashboard")
  })
  
  $("#profile").click(() => {
    window.location.replace("http://127.0.0.1:5000/profile")  
  })

  $("#logout").click(()=>{
    document.cookie = 'noteToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.replace("http://127.0.0.1:5000/login")  
  })

})