from flask import Flask, jsonify, render_template, request
from flask_sqlalchemy import SQLAlchemy
import pymysql
from functools import wraps
import jwt
import urllib.parse
from cryptography.fernet import Fernet
from datetime import datetime, timedelta
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from data import email_password, email_id, mysql_root_password

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "mysql+pymysql://root:%s@localhost/notesDB" % urllib.parse.quote(mysql_root_password)
app.config['SECRET_KEY'] = '4afd1c162343171e'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
fernet_key = b'T_avXy2H2ni4G-UhPT0wDTNq34jbo3Fwa47UMswe57o='
cipher_suite = Fernet(fernet_key)

class Users(db.Model):
  user_id = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(30), unique = True)
  password = db.Column(db.String(255), nullable=False)
  email = db.Column(db.String(225), nullable=False)
  mobile_no = db.Column(db.BigInteger)
  birthdate = db.Column(db.Date)
  forgot_password_token = db.Column(db.String(300))

  def __repr__(self):
    return '<user_id : %r, User : %r>' % self.username, self.user_id
    
class Notes(db.Model):
  note_id = db.Column(db.Integer, primary_key=True)
  title = db.Column(db.String(30), unique = True)
  note = db.Column(db.Text, nullable=False)
  user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
  
  def __repr__(self):
    return '<note_id : %r, Note-Title : %r>' % self.note_id, self.title

def encrypt_password(password):
  encoded_password = cipher_suite.encrypt(password.encode('utf-8'))
  return encoded_password

def decrypt_password(encoded_password):
  decoded_password = cipher_suite.decrypt(encoded_password.encode('utf-8'))
  return decoded_password

def send_mail(token, receiver_address):
  mail_content = (
  "<h3 >To reset your schedules password, please click this link</h2><br>"
  "<h3><a href='http://127.0.0.1:5000/forgot-password/"+str(token)+"'>Reset password</a></h3><br><br>"
  "This link will expire in 24 hours"
  )
  
  sender_address = str(email_id)
  sender_pass = str(email_password)

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
    print('Email sent')
    return True
  except Exception as e:
    print(e)
    return False
  

# token by username
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


def token_required(func):
  @wraps(func)
  def decorator(*args, **kwargs):
    token = None
    if 'x-access-tokens' in request.headers:
      token = request.headers['x-access-tokens']
    if not token:
      return jsonify({'message': 'a valid token is missing'}), 
    
    try:
      data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
      current_user = Users.query.filter_by(username=data["user"]).first()

    except jwt.ExpiredSignatureError:
      return ({"message": 'Token expired'})  

    except:
      return ({'message': 'token is invalid'})
 
    return func(current_user, *args, **kwargs)
  return decorator

@app.route('/signup')
def signup():
  return render_template('signup.html')

@app.route('/login')
def login():
  return render_template('login.html')

@app.route('/profile')
def profile():
  return render_template('profile.html')

@app.route('/dashboard')
def dashboard():
  return render_template('dashboard.html')

@app.route('/add-note')
def add_note():
  return render_template('add-note.html')

@app.route('/forgot-password')
def get_user():
  return render_template('forgot-password.html')

@app.route('/reset-password')
def reset_password():
  return render_template('reset-password.html')

# POST / add user
@app.route('/users', methods=["POST"])
def add_user_api():
  username = request.form.get('username')
  password = encrypt_password(request.form.get('password'))
  email = request.form.get('email')
  
  try:
    user = Users(username=username, password=password, email=email)
    db.session.add(user)
    db.session.commit()
    
    return ('success', 200)
  except:
    return ('ERROR')

# GET user by username
@app.route('/users/<username>', methods=["POST"])
def get_user_api(username):
  try:
    user = Users.query.filter_by(username=username).first()
    password = decrypt_password(user.password).decode("utf-8")
    
    if password == request.form.get('password'):
      token = create_login_token(username)
      if token:
        print(token)
        return ({'token' : token}, 200)
      else:
        return ('Error generating token', 500)
    else:
      return ('Incorrect user or password', 404)  
  except:
    return ('Servver side error', 500)

# GET,PUT,DELETE user by username
@app.route('/users', methods=["GET","PUT","DELETE"])
@token_required
def user_api(current_user):
  if request.method == "GET": 
    try:
      user = Users.query.filter_by(username=current_user.username).first()  
      data = {
        "user_id": user.user_id,
        "username": user.username,
        "password": decrypt_password(user.password).decode("utf-8"),
        "email": user.email,
        "mobile_no": user.mobile_no,
        "birthdate": user.birthdate
      }
      if data != {}:
        return data
      else:
        return ('User does not exist', 404)
    except:
      return ('Servver side error', 500)

  elif request.method == "PUT":
    try:
      user = Users.query.filter_by(username=current_user.username).first()
      
      user.username = request.form.get('username')
      user.password = encrypt_password(request.form.get('password'))
      user.email = request.form.get('email')
      
      if request.form.get('mobile_no'):
        user.mobile_no = request.form.get('mobile_no')
      else:
        user.mobile_no = None

      if request.form.get('birthdate'):
        user.birthdate = request.form.get('birthdate')
      else:
        user.birthdate = None

      db.session.commit()
      
      return ({ "message": "success" }, 200)
      
    except:
      return ('Server side error', 500)

  elif request.method == "DELETE":
    try:
      Users.query.filter_by(username=current_user.username).delete()
      db.session.commit()
      return ("success", 200)
    except:
      return ("Error", 404)

# POST / add note
@app.route('/notes', methods=["GET","POST"])
@token_required
def note_api(current_user):
  if request.method == "GET":
    try:
      notes = Notes.query.filter_by(user_id=current_user.user_id)
      note_list = []
      for note in notes:
        note_list.append({
          "note_id": note.note_id,
          "title": note.title,
          "note": note.note
        })
      return jsonify(note_list), 200
    except:
      return ('Error', 404)  

  elif request.method == "POST":
    title = request.form.get('title')
    note_text = request.form.get('note')
    
    try:
      note = Notes(title=title, note=note_text, user_id=current_user.user_id)
      db.session.add(note)
      db.session.commit()
      return ('SUCCESS', 200) 
    except:
      return ('ERROR', 500)
  
# GET,PUT,DELETE / get note by note_id
@app.route('/notes/<noteId>', methods=["GET","PUT","DELETE"])
@token_required
def get_note_by_note_id_api(current_user, noteId):
  if request.method == "GET":
    try:
      note = Notes.query.filter_by(note_id=noteId).first()
      data = {
        "note_id": note.note_id,
        "title": note.title,
        "note": note.note,
        "user_id": note.user_id
      }
      return (data, 200)
    except:
      return ('ERROR', 404)

  elif request.method == "PUT":
    try:
      note = Notes.query.filter_by(note_id=noteId).first()
      note.title = request.form.get('title')
      note.note = request.form.get('note')
      
      db.session.commit()
      return ('Success', 200)
    except:
      return ('Servver side error', 500)

  elif request.method == "DELETE":
    try:
      Notes.query.filter_by(note_id=noteId).delete()
      db.session.commit()
      return ("success", 200)
    except:
      return ("Error", 404)

# GET set forgot password token by username
@app.route('/send-reset-email', methods=["POST"])
def reset_fp_get_user():
  username = request.form.get('username')
  
  try:
    payload = {
      'user': username,
      'exp': datetime.timestamp(datetime.now()+timedelta(seconds=60))
    }
    token = jwt.encode(
      payload,
      app.config.get('SECRET_KEY'),
      algorithm='HS256'
    )
    
    user = Users.query.filter_by(username=username).first()
    user.forgot_password_token = token
    email = user.email
    db.session.commit()
    
    if send_mail(token, 'hetsuthar2001@gmail.com'): # email
      return ({'message' : 'token generated'}, 200)
    else:
      return ({'message' : 'Error sending email'}, 502)
  except:
    return ('Error generating token', 500)

@app.route('/forgot-password/<token>', methods=['GET'])
def forgot_password(token):
  try:
    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    user = Users.query.filter_by(username=data['user']).first()
    
    if user.forgot_password_token == token:
      user.forgot_password_token = None
      db.session.commit()
      return render_template('reset-password.html', token=token)
    else:
      return ({'message': 'Used Token'})

  except jwt.ExpiredSignatureError:
    return ({"message": 'Token expired'})  

@app.route('/reset-password', methods=['PUT'])
def reset_password_api():
  token = request.form.get('token')
  password = request.form.get('password')
  try:
    data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    user = Users.query.filter_by(username=data['user']).first()
    user.password = encrypt_password(password)
    db.session.commit()
    return ({'message': 'Password updated'}, 200)
  
  except jwt.ExpiredSignatureError:
    return ({"message": 'Token expired'})
  except:
    return ({'message': 'Error updateing password'}, 500)


if __name__ == "__main__":
  app.run(debug=True)