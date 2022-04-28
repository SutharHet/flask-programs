$(document).ready(() => {
  token = ''
  timezone = ''
  let DateTime = luxon.DateTime
  sessionStorage.removeItem("taskId")
  limit = $('#limit').val()

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
        $('tbody').html('')
        
        let count = 0
        loop1:
        for(let j=0; j < days.length; j++){
          loop2:
          for(let i=0; i < data.length; i++){

            times = getTimes(data[i].start_time, data[i].end_time)
            if(data[i].days.includes(days[j])){
              if(count < limit){
                count++
              }else{
                break loop1;
              }
              
              $('tbody').append(`
                <tr>
                  <td>`+data[i].task+`</td>
                  <td>`+days[j]+`</td>
                  <td>`+times[0]+`</td>
                  <td>`+times[1]+`</td>
                  <td><button id=\"e`+data[i].task_id+`\" class="btn btn-primary">Edit</button></td>
                  <td><button id=\"d`+data[i].task_id+`\" class="btn btn-warning">Del</button></td>
                </tr>
              `)
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


  $('#set-limit').on("click", (event) => {
    limit = $('#limit').val()
    getWeeklyData()
  })

  let deleteWeeklyData = (id) => {
    let obj = {
      type: "DELETE",
      url: "/tasks/"+id,
      headers: {
        'x-access-token': token
      },
      success: () => {
        getWeeklyData()  
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
    window.location.replace("http://127.0.0.1:5000/add-weekly-task")  
  }

  $(".chosen-select").chosen({
    no_results_text: "Oops, nothing found!"
  })
  
  $("body").on("click","#clear-btn", (event) => {
    getWeeklyData()
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
        
        $('#week-tasks').html(`
          <tr>
            <th>Task</th>
            <th>day</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th></th>
            <th></th>
          </tr>
        `)
        
        for(let i=0; i < data.length; i++){
          taskDays = String($('#days').val()).split(',')
          for(let j=0; j < taskDays.length; j++){

            if(data[i].days.includes(taskDays[j])){
              
              $('#week-tasks').append(`
                <tr>
                  <td>`+data[i].task+`</td>
                  <td>`+taskDays[j]+`</td>
                  <td>`+times[0]+`</td>
                  <td>`+times[1]+`</td>
                  <td><button id=\"e`+data[i].task_id+`\">Edit</button></td>
                  <td><button id=\"d`+data[i].task_id+`\">Del</button></td>
                </tr>
              `)
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

  $("table").on("click","button",(event) => {
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