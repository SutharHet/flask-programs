from flask import Flask, request, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
import urllib.parse
import jwt
from functools import wraps
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import p_data
import pymysql
    
app = Flask(__name__)

app.config['SECRET_KEY'] = '28e1e722d0899505'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:{}@localhost/scheduleDB'.format(urllib.parse.quote('Root@123456'))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

fernet_key = b'T_avXy2H2ni4G-UhPT0wDTNq34jbo3Fwa47UMswe57o='
cipher_suite = Fernet(fernet_key)

# user table class model
class User(db.Model):
  user_id = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(30), unique = True)
  password = db.Column(db.String(255), nullable=False)
  email = db.Column(db.String(225), nullable=False)
  mobile_no = db.Column(db.BigInteger)
  forgot_password_token = db.Column(db.String(300))
  timezone = db.Column(db.String(256))

# weekly_schedule table class model
class Weekly_schedule(db.Model):
  task_id = db.Column(db.Integer, primary_key=True, nullable=False)
  task = db.Column(db.String(255), nullable=False)
  created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)
  days = db.Column(db.JSON, nullable=False)
  start_time = db.Column(db.String(30), nullable=False)
  end_time = db.Column(db.String(30), nullable=False)
  user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete="cascade"), nullable=False)

# datetime_schedule table class Model
class Datetime_schedule(db.Model):
  task_id = db.Column(db.Integer, primary_key=True, nullable=False)
  task = db.Column(db.String(255), nullable=False)
  created_at = db.Column(db.DateTime, server_default=func.now(), nullable=False)
  start_datetime = db.Column(db.String(30), nullable=False)
  end_datetime = db.Column(db.String(30), nullable=False)
  user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete="cascade"), nullable=False)

# encypt password
def encrypt_password(password):
  encoded_password = cipher_suite.encrypt(password.encode('utf-8'))
  return encoded_password

# decrypt password
def decrypt_password(encoded_password):
  decoded_password = cipher_suite.decrypt(encoded_password.encode('utf-8'))
  return decoded_password

# email reset password link
def send_mail(token, receiver_address):
  mail_content = (
  "<h3 >To reset your schedules password, please click this link</h2><br>"
  "<h3><a href='http://127.0.0.1:5000/forgot-password/"+str(token)+"'>Reset password</a></h3><br><br>"
  "This link will expire in 24 hours"
  )
  
  sender_address = str(p_data.email_id)
  sender_pass = str(p_data.email_password)

  message = MIMEMultipart()
  message['From'] = sender_address
  message['To'] = receiver_address
  message['Subject'] = 'Reset Schedule password' 

  #The body and the attachments for the mail
  message.attach(MIMEText(mail_content, 'html'))
  
  #Create SMTP session for sending the mail
  session = smtplib.SMTP('smtp.gmail.com', 587) #use gmail with port
  session.starttls() #enable security
  session.login(sender_address, sender_pass) #login with mail_id and password
  text = message.as_string()
  
  try:
    session.sendmail(sender_address, receiver_address, text) 
    session.quit()
    
    return True
  except:
    return False

def iso_to_datetime(date_str):
  return datetime.fromisoformat(date_str[:-1])

# check for overlap in given time
def overlap(start,end, old_start, old_end):
  if old_start < start < old_end:
     return False
  elif old_start < end < old_end:
     return False
  elif start < old_start < end:
     return False
  elif start < old_end < end:
     return False
  elif start == old_start and end == old_end:
    return False
  return True

# get user schedule and get time to check overlap
def check_overlap(user, start, end, days):

  start = datetime.fromisoformat(start[:-1]).strftime("%H:%M")
  end = datetime.fromisoformat(end[:-1]).strftime("%H:%M")

  data = Weekly_schedule.query.filter_by(user_id = user.user_id)
  times = []
  for task in data:
    start_time = datetime.fromisoformat(task.start_time[:-1]).strftime("%H:%M")
    end_time = datetime.fromisoformat(task.end_time[:-1]).strftime("%H:%M")
    times.append({
      'start_time': start_time,
      'end_time': end_time,
      "days": task.days
    })

  for task in times:
    for day in days.split(','):
      if day in task['days']:
         if not overlap(start, end, task['start_time'], task['end_time']):
          return False

  return True


# get user schedule and get time to check overlap
def check_datetime_overlap(user, start, end):
  start = datetime.fromisoformat(start[:-1])
  end = datetime.fromisoformat(end[:-1])

  data = Datetime_schedule.query.filter_by(user_id = user.user_id)
  datetimes = []
  for task in data:
    start_datetime = datetime.fromisoformat(task.start_datetime[:-1])
    end_datetime = datetime.fromisoformat(task.end_datetime[:-1])
    datetimes.append({
      'start_datetime': start_datetime,
      'end_datetime': end_datetime
    })

  for task in datetimes:
    if not overlap(start, end, task['start_datetime'], task['end_datetime']):
      return False

  return True

def create_login_token(username):
  try:
    payload = {
      'user': username,
      'exp': datetime.timestamp(datetime.now()+timedelta(minutes=30))
    }
    token = jwt.encode(
      payload,
      app.config.get('SECRET_KEY'),
      algorithm='HS256'
    )
    
    return str(token)
  except :
    return None

# check for token
def token_required(func):
  @wraps(func)
  def decorator(*args, **kargs):
    token = None

    if 'x-access-token' in request.headers:
      token = request.headers['x-access-token']
    else:
      return ({'message': 'a valid token is missing'}, 401) 

    try:
      data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
      current_user = User.query.filter_by(username = data['user']).first()
    except:
      return ({'message': 'token is invalid'}, 401)

    return func(current_user, *args, *kargs)  
  return decorator


#----------------------- render pages

@app.route('/')
def index():
  return ('Online', 200)

@app.route('/signup')
def signup():
  return render_template('signup.html')

@app.route('/login')
def login():
  return render_template('login.html')

@app.route('/dashboard')
def dashboard():
  return render_template('dashboard.html')

@app.route('/datetime-dashboard')
def datetime_dashboard():
  return render_template('datetime-dashboard.html')

@app.route('/profile')
def profile():
  return render_template('profile.html')

@app.route('/add-weekly-task')
def add_weekly_task():
  return render_template('add-weekly-task.html')

@app.route('/add-datetime-task')
def add_date_task():
  return render_template('add-datetime-task.html')

@app.route('/forgot-password')
def get_user():
  return render_template('forgot-password.html')

@app.route('/reset-password')
def reset_password():
  return render_template('reset-password.html')


#----------------------- user

# POST user
@app.route('/users', methods=["POST"])
def add_user_api():
  username = request.form.get('username')
  password = encrypt_password(request.form.get('password'))
  email = request.form.get('email')
  timezone = request.form.get('timezone')

  try:
    user = User(username=username, password=password, email=email, timezone=timezone)
    db.session.add(user)
    db.session.commit()

    return ({'message': 'User successfuly added'}, 200)
  except:
    return ({'message': 'Error adding user'}, 500)

# GET user by username
@app.route('/users/<username>', methods=["POST"])
def get_user_api(username):
  try:
    user = User.query.filter_by(username=username).first()
    password = decrypt_password(user.password).decode('utf-8')
    
    if password == request.form.get('password'):
      token = create_login_token(username)
      if token:
        return ({'message': 'token generated','token' : token}, 200)
      else:
        return ({"message":'Error generating token'}, 500)
    else:
      return ({'message':'Incorrect user or password'}, 404)  
  except:
    return ({'message': 'Error getting user'}, 500)

# GET, PUT, DELETE user with token
@app.route('/users', methods=["GET","PUT","DELETE"])
@token_required
def user_api(current_user):
  if request.method == "GET":
    try:
      user = User.query.filter_by(username=current_user.username).first()
      
      data = {
        'username': user.username,
        'password': decrypt_password(user.password).decode('utf-8'),
        'email': user.email,
        'mobile_no': user.mobile_no,
        'timezone': user.timezone
      }
      
      return ({'message': 'User data successfuly retrived', 'data': data}, 200)
    except:
      return ({'message': 'Error getting user'}, 500)
  
  elif request.method == "PUT":
    try:
      user = User.query.filter_by(username=current_user.username).first()
      
      user.username = request.form.get('username')
      user.password = encrypt_password(request.form.get('password'))
      user.email = request.form.get('email')
      
      if request.form.get('mobile_no'):
        user.mobile_no = request.form.get('mobile_no')
      else:
        user.mobile_no = None

      db.session.commit()
      
      return ({ "message": "Successfuly updated user data" }, 200) 
    except:
      return ({ "message": "Error updating user data" }, 500)

  elif request.method == "DELETE":
    try:
      User.query.filter_by(username=current_user.username).delete()
      db.session.commit()
    
      return ({'message': 'User successfuly deleted'}, 200)
    except:
      return ({'message': 'Error deleting user'}, 500)

#-----------------------Weekly schedule

# GET schedule, POST task with token 
@app.route('/schedules', methods=["GET", "POST"])
@token_required
def schedules_api(current_user):  
  if request.method == "GET":
    try:
      schedule = Weekly_schedule.query.filter_by(user_id = current_user.user_id).order_by(Weekly_schedule.start_time).all()
      
      data = []

      for task in schedule:
        data.append({
        'task_id': task.task_id,
        'task': task.task,
        'days': task.days,
        'start_time': task.start_time,
        'end_time': task.end_time
        })
        
      return ({'message': 'Schedule successfuly retrived', 'data': data}, 200)
    except:
      return ({'message': 'Error getting schedule'}, 500)

  elif request.method == "POST":
    task = request.form.get('task')
    days = request.form.get('days')
    
    start_time = request.form.get('start_time')
    end_time = request.form.get('end_time')

    if not check_overlap(current_user,start_time, end_time, days):
      return({"message" : "Time overlaps with other schedule"}, 400)
    else:
      try:
        task = Weekly_schedule(task=task, days=days, start_time=start_time, end_time=end_time, user_id=current_user.user_id)
        db.session.add(task)
        db.session.commit()

        return ({'message': 'Task successfuly added'}, 200)
      except:
        return ({'message': 'Error adding task'}, 500)

# GET, PUT, DELETE tasks with token
@app.route('/tasks/<int:taskId>', methods=["GET", "PUT", "DELETE"])
@token_required
def task_api(current_user, taskId):
  taskId = request.view_args['taskId']

  if request.method == "GET":
    try:
      task = Weekly_schedule.query.filter_by(task_id=taskId).first()

      data = {
        'task': task.task,
        'days': task.days,
        'start_time': task.start_time,
        'end_time': task.end_time
      }
      
      return ({'message': 'Task data successfuly retrived', 'data': data}, 200)
    except:
      return ({'message': 'Error getting task'}, 500)

  elif request.method == "PUT":
    days = request.form.get('days')

    start_date = request.form.get('start_time')
    end_date = request.form.get('end_time')

    if not check_overlap(current_user,start_date, end_date, days):
      return({"message" : "Time overlaps with other schedule"}, 400)
    else:
      try:
        user = Weekly_schedule.query.filter_by(task_id=taskId).first()
        
        user.task = request.form.get('task')
        user.days = days
        user.start_time = start_date
        user.end_time = end_date
        
        db.session.commit()
        
        return ({ "message": "task Successfuly updated" }, 200) 
      except:
        return ({ "message": "Error updating task" }, 500)

  elif request.method == "DELETE":
    try:
      Weekly_schedule.query.filter_by(task_id=taskId).delete()
      db.session.commit()
    
      return ({'message': 'Task successfuly deleted'}, 200)
    except:
      return ({'message': 'Error deleting Task'}, 500)

#----------------------- datetime schedule

# GET datetime schedule, POST datetime task with token 
@app.route('/datetime/schedule', methods=["GET", "POST"])
@token_required
def datetime_schedule_api(current_user):  
  if request.method == "GET":
    try:
      schedule = Datetime_schedule.query.filter_by(user_id = current_user.user_id).order_by(Datetime_schedule.start_datetime).all()
      
      data = []

      for task in schedule:
        data.append({
        'task_id': task.task_id,
        'task': task.task,
        'start_datetime': task.start_datetime,
        'end_datetime': task.end_datetime
        })

      return ({'message': 'Schedule successfuly retrived', 'data': data}, 200)
    except:
      return ({'message': 'Error getting schedule'}, 500)

  elif request.method == "POST":
    task = request.form.get('task')
    
    start_datetime = request.form.get('start_datetime')
    end_datetime = request.form.get('end_datetime')

    if not check_datetime_overlap(current_user,start_datetime, end_datetime):
      return({"message" : "Time overlaps with other schedule"}, 400)
    else:
      try:
        task = Datetime_schedule(task=task, start_datetime=start_datetime, end_datetime=end_datetime, user_id=current_user.user_id)
        db.session.add(task)
        db.session.commit()

        return ({'message': 'Task successfuly added'}, 200)
      except Exception as e:
        print(e)
        return ({'message': 'Error adding task'}, 500)


def datetime_filter(start, end, schedule):
  data = []

  for task in schedule:
    start_datetime = iso_to_datetime(task.start_datetime)
    print(start, start_datetime)
    
    if end:
      if start_datetime >= start and start_datetime <= end:
        data.append({
          'task_id': task.task_id,
          'task': task.task,
          'start_datetime': task.start_datetime,
          'end_datetime': task.end_datetime
        })
    else:
      if start_datetime >= start:
        data.append({
          'task_id': task.task_id,
          'task': task.task,
          'start_datetime': task.start_datetime,
          'end_datetime': task.end_datetime
        })

  return data

@app.route('/datetime/filter/schedule', methods=["GET"])
@token_required
def datetime_filter_schedule_api(current_user):  
  if request.method == "GET":
    startDate = iso_to_datetime(request.args.get('startDate'))
    
    endDate = request.args.get('endDate')
    if endDate:
      endDate = iso_to_datetime(endDate)

    try:
      schedule = Datetime_schedule.query.filter_by(user_id = current_user.user_id)

      data = datetime_filter(startDate, endDate, schedule)  
      
       
      return ({'message': 'Schedule successfuly retrived', 'data': data}, 200)
    except Exception as e:
      print(e)
      return ({'message': 'Error getting schedule'}, 500)

# GET, PUT, DELETE datetime tasks with token
@app.route('/datetime/tasks/<int:taskId>', methods=["GET", "PUT", "DELETE"])
@token_required
def datetime_task_api(current_user, taskId):
  taskId = request.view_args['taskId']

  if request.method == "GET":
    try:
      
      task = Datetime_schedule.query.filter_by(task_id=taskId).first()

      data = {
        'task': task.task,
        'start_datetime': task.start_datetime,
        'end_datetime': task.end_datetime
      }
      print(data)
      return ({'message': 'Task data successfuly retrived', 'data': data}, 200)
    except:
      return ({'message': 'Error getting task'}, 500)

  elif request.method == "PUT":
    start_datetime = request.form.get('start_datetime')
    end_datetime = request.form.get('end_datetime')

    print(start_datetime, end_datetime)
    if not check_datetime_overlap(current_user,start_datetime, end_datetime):
      return({"message" : "Time overlaps with other schedule"}, 400)
    else:
      try:
        user = Datetime_schedule.query.filter_by(task_id=taskId).first()
        
        user.task = request.form.get('task')
        user.start_datetime = start_datetime
        user.end_datetime = end_datetime
        
        db.session.commit()
        
        return ({ "message": "task Successfuly updated" }, 200) 
      except Exception as e:
        print(e)
        return ({ "message": "Error updating task" }, 500)

  elif request.method == "DELETE":
    try:
      Datetime_schedule.query.filter_by(task_id=taskId).delete()
      db.session.commit()
    
      return ({'message': 'Task successfuly deleted'}, 200)
    except:
      return ({'message': 'Error deleting Task'}, 500)

#----------------------- reset password

# GET set forgot password token by username
@app.route('/send-reset-email', methods=["POST"])
def reset_fp_get_user():
  username = request.form.get('username')
  
  try:
    payload = {
      'user': username,
      'exp': datetime.timestamp(datetime.now()+timedelta(minutes=30))
    }
    token = jwt.encode(
      payload,
      app.config.get('SECRET_KEY'),
      algorithm='HS256'
    )
    
    user = User.query.filter_by(username=username).first()
    user.forgot_password_token = token
    email = user.email
    db.session.commit()
    
    if send_mail(token, email):
      return ({'message' : 'token generated'}, 200)
    else:
      return ({'message' : 'Error sending email'}, 502)
  except:
    return ('Error generating token', 500)

# GET / Validate reset password link token
@app.route('/forgot-password/<token>', methods=['GET'])
def forgot_password(token):
  try:
    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    user = User.query.filter_by(username=data['user']).first()
    
    if user.forgot_password_token == token:
      user.forgot_password_token = None
      db.session.commit()
      return render_template('reset-password.html', token=token)
    else:
      return ({'message': 'Used Token'})

  except jwt.ExpiredSignatureError:
    return ({"message": 'Token expired'})

# PUT / reset password
@app.route('/reset-password', methods=['PUT'])
def reset_password_api():
  token = request.form.get('token')
  password = request.form.get('password')
  try:
    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    user = User.query.filter_by(username=data['user']).first()
    user.password = encrypt_password(password)
    db.session.commit()
    return ({'message': 'Password updated'}, 200)
  
  except jwt.ExpiredSignatureError:
    return ({"message": 'Token expired'})
  except:
    return ({'message': 'Error updateing password'}, 500)


if __name__ == "__main__":
  app.run(debug=True)