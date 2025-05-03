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
import threading


app = Flask(__name__)
app.config['SECRET_KEY'] = '6as7d6f876xyucxgyfyu63tuy32tuc'
socketio = SocketIO(app)
socketio.init_app(app, cors_allowed_origins="*")
login_manager = LoginManager()
login_manager.init_app(app)
db_session.global_init('db/data.db')

games = {}


@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    socketio.emit('audio_chunk', data)


@socketio.on('player ready')
def player_ready(data):
    print('player ready', data)
    db_sess = db_session.create_session()
    games[data[0]]['players'][data[1]] = {'role': 0, 'player_status': 0, 'name': db_sess.query(User).filter(User.id == data[1]).first().name}


@socketio.on('player get info')
def player_get_info(data):
    print('player get info', data)
    games[data[0]]['players'][data[1]]['player_status'] = 1


@socketio.on('player start discuss')
def player_start_discuss(data):
    print('player start discuss', data)
    games[data[0]]['players'][data[1]]['player_status'] = 2


def generate_info(players):
    hunter = [p for p in players if players[p]['role'] == 1][0]
    result = []
    secret_call = False
    for p in players:
        if p == hunter:
            result.append([p, 'Ты - <b>Двойной Агент</b>. Не дай им себя раскрыть!'])
        else:
            if secret_call:
                first_second = [players[hunter]['name'], players[random.choice([i for i in players if i != hunter])]['name']]
                if random.randint(0, 1):
                    first_second = first_second[::-1]
                first = first_second[0]
                second = first_second[1]
                result.append([p, 'После успешного взлома серверов <b>Team Hunters</b> стало известно, что их агентом является либо <b>' + first + '</b>, либо <b>' + second + '</b>.'])
            else:
                who = players[random.choice([i for i in players if i not in [hunter, p]])]['name']
                result.append([p, 'Совершив секретный звонок своему начальству, вы узнаёте, что <b>Секретным Агентом</b> является <b>' + who + '</b>.'])
    return result
    

def games_polling():
    global games
    while True:
        for game_id in games:
            pl = games[game_id]['players'].copy()
            if len(pl) == 4 and games[game_id]['game_status'] == 0:
                games[game_id]['game_status'] = 1
                hunter_id = random.choice(list(pl))
                print(hunter_id)
                games[game_id]['players'][hunter_id]['role'] = 1
                socketio.emit('starting', hunter_id)
            elif all([pl[i]['player_status'] == 1 for i in pl]) and games[game_id]['game_status'] == 1:
                games[game_id]['game_status'] = 2
                info = generate_info(games[game_id]['players'])
                socketio.emit('info', info)
            elif all([pl[i]['player_status'] == 2 for i in pl]) and games[game_id]['game_status'] == 2:
                games[game_id]['game_status'] = 3
                socketio.emit('discuss')


target = threading.Thread(target=games_polling)
target.start()


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
                user.name = form.name.data
                db_sess.commit()
                return redirect('/lobby')
            else:
                return render_template('join.html', form=form, message='Неверный код!')
        else:
            games_ids = [i.code for i in db_sess.query(Game).all()]
            game_id = random.choice([i for i in range(10, 99) if i not in games_ids])
            game = Game(leader=current_user.id, code=game_id)
            games[game_id] = {'players': {}, 'game_status': 0}
            db_sess.add(game)
            user = db_sess.query(User).filter(User.id == current_user.id).first()
            user.game_code = game_id
            user.name = form.name.data
            db_sess.commit()
            return redirect('/lobby')
    return render_template('join.html', form=form)


@app.route('/lobby', methods=['GET', 'POST'])
@login_required
def lobby():
    db_sess = db_session.create_session()
    if len(db_sess.query(User).filter(User.game_code == current_user.game_code).all()) == 4:
        return redirect('/game')
    return render_template('lobby.html')


@app.get('/game')
@login_required
def game():
    return render_template('game.html')


if __name__ == '__main__':
    socketio.run(app, host='192.168.0.106', port=8000, debug=True)