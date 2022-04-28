$(document).ready(() => {
  let DateTime = luxon.DateTime
  $("#start-time").val('00:00')
  $("#end-time").val('00:00')

  token = ''
  let data = {}
  taskId = sessionStorage.getItem("taskId")
  
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

  let updateTimes = (startDate, endDate) => {
    startDate = DateTime.fromISO(startDate, { zone: timezone })
    endDate = DateTime.fromISO(endDate, { zone: timezone })
  
    startTime = startDate.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    endTime = endDate.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    
    return [startTime, endTime]
  }

  let setNoteData = () => {
    let obj ={
      type: "GET",
      url: "/tasks/"+taskId,
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        data = res.data
        
        $("#task").val(data.task)
        dataDays = data.days.split(',')
        for(let i=0; i< dataDays.length; i++){
          $("#days option[value='"+dataDays[i]+"'").attr("selected", "selected")
        }

        times = updateTimes(data.start_time, data.end_time)

        $("#start-time").val(times[0])
        $("#end-time").val(times[1])
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
        window.location.replace("http://127.0.0.1:5000/dashboard") 
      }
    }
    $.ajax(obj)
  } 

  let getUser = () => {
    let obj ={
      type: "GET",
      url: "/users",
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        data = res.data
        $("#profile span").html(data.username.charAt(0).toUpperCase())
        timezone = data.timezone
        
        if(taskId != null){
          setNoteData()
        }
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
        window.location.replace("http://127.0.0.1:5000/dashboard") 
      }
    }
    $.ajax(obj)
  }

  let checkCookie = () => {
    token = getCookie("scheduleToken");
    if (token != "") {
      getUser()   
    } else {
      window.location.replace("http://127.0.0.1:5000/login")  
    }
  }

  checkCookie()

  $("#days").mousedown((e) => {
    e.preventDefault();

    var select = this;
    var scroll = select.scrollTop;

    e.target.selected = !e.target.selected;

    setTimeout(function(){select.scrollTop = scroll;}, 0);

    $(select ).focus();
  }).mousemove(function(e){e.preventDefault()});  

  $("#add").click(()=>{
    let obj = {}
    let taskData = {}

    startTime = $("#start-time").val()
    endTime = $("#end-time").val()

    let startDate = '1970-01-01T'+startTime
    let endDate = '1970-01-01T'+endTime
  
    startDate = DateTime.fromISO(startDate, { zone: timezone })
    endDate = DateTime.fromISO(endDate, { zone: timezone })
 
    utcStartDate = startDate.toUTC()
    utcEndDate = endDate.toUTC()
    
    taskData = {
      task: $("#task").val(),
      days: String($("#days").val()),
      start_time: utcStartDate.toISO(),
      end_time: utcEndDate.toISO(),
    }
    
    console.log(taskData)
    if (taskData.task == data.task && taskData.start_time == data.start_time && taskData.end_time == data.end_time){
      daysArr = data.days.split(',')
      if (daysArr.every(v => taskData.days.includes(v))) {
        window.location.replace("http://127.0.0.1:5000/dashboard")            
      }
    }

    if(taskId != null){
      obj = {
        type: "PUT",
        url: "/tasks/"+taskId,
        headers: {
          'x-access-token': token
        },
        data: taskData,
        success: () => {
          sessionStorage.removeItem("taskId")
          window.location.replace("http://127.0.0.1:5000/dashboard")  
        },
        error: (res) => {
          resJson = res.responseJSON
          alert(resJson['message'])
        }
      }
    }else{
      obj = {
        type: "POST",
        url: "/schedules",
        headers: {
          'x-access-token': token
        },
        data: taskData,
        success: () => {
          window.location.replace("http://127.0.0.1:5000/dashboard")  
        },
        error: (res) => {
          resJson = res.responseJSON
          alert(resJson['message'])
        }
      }
    }
    
    $.ajax(obj)   
  })
})