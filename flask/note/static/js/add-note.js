$(document).ready(() => {
  token = ''
  noteId = sessionStorage.getItem("noteId")
  let userId = ""  
  
  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/dashboard")
  })
  $("#profile").click(() => {
    window.location.replace("http://127.0.0.1:5000/profile")  
  })

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

  let setNoteData = () => {
    let obj ={
      type: "GET",
      url: "/notes/"+noteId,
      headers: {
        'x-access-tokens': token
      },
      success: (data) => {
        $("#title").val(data.title)
        $("#note").val(data.note)
      },
      error: () => {
        console.log("Server side error")
      }
    }
    $.ajax(obj)
  } 

  let getUser = () => {
    let obj ={
      type: "GET",
      url: "/users",
      headers: {
        'x-access-tokens': token
      },
      success: (data) => {
        userId = data.user_id
        $("#profile span").html(data.username.charAt(0).toUpperCase())
        if(noteId != null){
          setNoteData()
        }
      },
      error: () => {
        console.log("Server side error")
      }
    }
    $.ajax(obj)
  }

  let checkCookie = () => {
    token = getCookie("noteToken");
    if (token != "") {
      getUser()   
    } else {
      window.location.replace("http://127.0.0.1:5000/login")  
    }
  }

  checkCookie()


  $("#add").click(()=>{
    let obj = {}
    let noteData = {}

    if(noteId != null){
      noteData = {
        title: $("#title").val(),
        note: $("#note").val()
      }

      obj = {
        type: "PUT",
        url: "/notes/"+noteId,
        headers: {
          'x-access-tokens': token
        },
        data: noteData,
        success: () => {
          sessionStorage.removeItem("noteId")
          window.location.replace("http://127.0.0.1:5000/dashboard")  
        },
        error: () => {
          console.log("error updating note data")
        }
      }
    }else{
      noteData = {
        title: $("#title").val(),
        note: $("#note").val(),
      }
      
      obj = {
        type: "POST",
        url: "/notes",
        headers: {
          'x-access-tokens': token
        },
        data: noteData,
        success: () => {
          sessionStorage.removeItem("noteId")
          window.location.replace("http://127.0.0.1:5000/dashboard")  
        },
        error: () => {
          console.log("error inserting note data")
        }
      }
    }
    
    $.ajax(obj)
  })
})