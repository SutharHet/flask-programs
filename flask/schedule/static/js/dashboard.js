$(document).ready(() => {
  token = ''
  timezone = ''
  let DateTime = luxon.DateTime
  sessionStorage.removeItem("taskId")


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
  
  $("#add-weekly-task").click(()=>{
    window.location.replace("http://127.0.0.1:5000/add-weekly-task")    
  })
  $("#add-datetime-task").click(()=>{
    window.location.replace("http://127.0.0.1:5000/add-datetime-task")    
  })
  $("#datetime-dashboard").click(()=>{
    window.location.replace("http://127.0.0.1:5000/datetime-dashboard")    
  })

  let getTimes = (startDate, endDate) => {
    startDate = DateTime.fromISO(startDate, { zone: timezone })
    endDate = DateTime.fromISO(endDate, { zone: timezone })
  
    startTime = startDate.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    endTime = endDate.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
    
    return [startTime, endTime]
  }
  let getWeeklyData = () => {
    let obj ={
      type: "GET",
      url: "/schedules",
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        data = res.data
        days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
        $('.container').children().not('h3').remove();
        for(let i=0; i < data.length; i++){
          taskDays = data[i].days.split(',')
          for(let j=0; j < taskDays.length; j++){

            times = getTimes(data[i].start_time, data[i].end_time)
            
            $("#"+taskDays[j]+"-tasks").append(`
              <div class=\"task-card\"> 
                <p class=\"task\">`+data[i].task+`</p> 
                <p class=\"task-datetime\">`+times[0]+` TO `+times[1]+`</p>
                <div class=\"btns\"> 
                  <button id=\"e`+data[i].task_id+`\">Edit</button> 
                  <button id=\"d`+data[i].task_id+`\">Del</button> 
                </div>
              </div>
            `)
          }
        }
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
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
        timezone = data.timezone
        $("#profile span").html(data.username.charAt(0).toUpperCase())
        getWeeklyData()
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
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

  let deleteWeeklyData = (id) => {
    let obj = {
      type: "DELETE",
      url: "/tasks/"+id,
      headers: {
        'x-access-token': token
      },
      success: () => {
        getData()  
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])  
      }
    }
    $.ajax(obj)
  }

  let editWeeklyData = (id) => {
    sessionStorage.setItem("taskId", id)
    window.location.replace("http://127.0.0.1:5000/add-task")  
  }

  $(".chosen-select").chosen({
    no_results_text: "Oops, nothing found!"
  })
  
  $("body").on("click","#clear-btn", (event) => {
    $('.container').css('display', 'flex')
    $('.container').css('margin-top', '20px')
    $('#sunday-tasks').css('margin-top', '340px')
    getWeeklyData()

    // days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    // for(let i=0; i< days.length; i++){
    //   $("#days option[value='"+days[i]+"'").attr("selected", "false")
    // }
  })
  $("body").on("click","#filter-btn", (event) => {

    let obj ={
      type: "GET",
      url: "/schedules",
      headers: {
        'x-access-token': token
      },
      success: (res) => {
        data = res.data
        console.log(data)
        $('.container').children().not('h3').remove();
        for(let i=0; i < data.length; i++){
          taskDays = String($('#days').val()).split(',')
          for(let j=0; j < taskDays.length; j++){

            if(data[i].days.includes(taskDays[j])){
              
            $("#"+taskDays[j]+"-tasks").append(`
              <div class=\"task-card\"> 
                <p class=\"task\">`+data[i].task+`</p> 
                <p class=\"task-datetime\">`+times[0]+` TO `+times[1]+`</p>
                <div class=\"btns\"> 
                  <button id=\"e`+data[i].task_id+`\">Edit</button> 
                  <button id=\"d`+data[i].task_id+`\">Del</button> 
                </div>
              </div>
            `)
            }
          }
        }

        days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
        let count = 0
        for(let i=0; i< days.length; i++){
          console.log()
          if($('#'+days[i]+'-tasks').has('div').length === 0){
            $('#'+days[i]+'-tasks').css('display', 'none')
          }else{
            $('#'+days[i]+'-tasks').css('display', 'flex')
            if(count === 0){
              console.log('here')
              $('#'+days[i]+'-tasks').css('margin-top', '350px')
              count = 1
            }
          }
        }
      },
      error: (res) => {
        resJson = res.responseJSON
        alert(resJson['message'])
      }
    }
    $.ajax(obj)

  })

  $(".container").on("click","button",(event) => {
    let btnId = event.target.id
    let method = btnId.charAt(0)
    let id = btnId.substring(1)

    if(method == "e"){
      editWeeklyData(id)
    }else{
      deleteWeeklyData(id)
    }
  })

  $(".main-header").click(()=>{
    window.location.replace("http://127.0.0.1:5000/dashboard")
  })
  
  $("#profile").click(() => {
    window.location.replace("http://127.0.0.1:5000/profile")  
  })

  $("#logout").click(()=>{
    document.cookie = 'scheduleToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.replace("http://127.0.0.1:5000/login")  
  })

})