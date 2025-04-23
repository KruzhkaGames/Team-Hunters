from flask import Flask, render_template, url_for, redirect
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from data import db_session
from data.users import User
from data.games import Game
from flask_wtf import FlaskForm
from wtforms import EmailField, PasswordField, SubmitField, StringField, IntegerField
from wtforms.validators import DataRequired
from flask_socketio import SocketIO
import random


app = Flask(__name__)
app.config['SECRET_KEY'] = '6as7d6f876xyucxgyfyu63tuy32tuc'
socketio = SocketIO(app, cors_allowed_origins="*")
login_manager = LoginManager()
login_manager.init_app(app)
db_session.global_init('db/data.db')


@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    socketio.emit('audio_chunk', data)


@login_manager.user_loader
def load_user(user_id):
    db_sess = db_session.create_session()
    return db_sess.query(User).get(user_id)


class LoginForm(FlaskForm):
    email = EmailField('Почта', validators=[DataRequired()])
    password = PasswordField('Пароль', validators=[DataRequired()])
    submit = SubmitField('Войти')


class RegisterForm(FlaskForm):
    email = EmailField('Почта', validators=[DataRequired()])
    password = PasswordField('Пароль', validators=[DataRequired()])
    submit = SubmitField('Зарегистрироваться')


class JoinForm(FlaskForm):
    name = StringField('Имя', validators=[DataRequired()])
    code = IntegerField('Код игры')
    create = SubmitField('Войти в игру!')


@app.route('/')
def index():
    logout_user()
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    logout_user()
    form = LoginForm()
    if form.validate_on_submit():
        db_sess = db_session.create_session()
        user = db_sess.query(User).filter(User.email == form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            return redirect('/join')
        return render_template('login.html', type_of=0, message='Неправильная почта или пароль', form=form)
    return render_template('login.html', type_of=0, form=form)


@app.route('/register', methods=['GET', 'POST'])
def register():
    logout_user()
    form = RegisterForm()
    if form.validate_on_submit():
        db_sess = db_session.create_session()
        if db_sess.query(User).filter(User.email == form.email.data).first():
            return render_template('register.html', type_of=1, form=form, message="Такой пользователь уже есть")
        user = User(email=form.email.data, game_code=0)
        user.set_password(form.password.data)
        db_sess.add(user)
        db_sess.commit()
        return redirect('/login')
    return render_template('register.html', type_of=1, form=form)


@app.route('/join', methods=['GET', 'POST'])
@login_required
def join():
    form = JoinForm()
    db_sess = db_session.create_session()
    user = db_sess.query(User).filter(User.id == current_user.id).first()
    user.game_code = 0
    db_sess.commit()
    if form.validate_on_submit():
        if int(form.code.data) != 0:
            if db_sess.query(Game).filter(Game.code == int(form.code.data)).all():
                user = db_sess.query(User).filter(User.id == current_user.id).first()
                user.game_code = int(form.code.data)
                db_sess.commit()
                return redirect('/lobby')
            else:
                return render_template('join.html', form=form, message='Неверный код!')
        else:
            games_ids = [i.code for i in db_sess.query(Game).all()]
            game_id = random.choice([i for i in range(10, 99) if i not in games_ids])
            game = Game(leader=current_user.id, code=game_id)
            db_sess.add(game)
            user = db_sess.query(User).filter(User.id == current_user.id).first()
            user.game_code = game_id
            db_sess.commit()
            return redirect('/lobby')
    return render_template('join.html', form=form)


@app.route('/lobby', methods=['GET', 'POST'])
@login_required
def lobby():
    db_sess = db_session.create_session()
    if len(db_sess.query(User).filter(User.game_code == current_user.game_code).all()) == 2:
        return redirect('/game')
    return render_template('lobby.html')


@app.get('/game')
@login_required
def game():
    return render_template('game.html')


if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=8000, debug=True)