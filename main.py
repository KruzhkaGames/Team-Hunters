from flask import Flask, render_template, url_for, redirect, request
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from data import db_session
from data.users import User
from data.games import Game
from flask_wtf import FlaskForm
from wtforms import EmailField, PasswordField, SubmitField, StringField, IntegerField
from wtforms.validators import DataRequired
from flask_socketio import SocketIO
import random
import json


app = Flask(__name__)
app.config['SECRET_KEY'] = ''
# app.register_blueprint(games_api.blueprint)
socketio = SocketIO(app, cors_allowed_origins="*")
login_manager = LoginManager()
login_manager.init_app(app)
db_session.global_init('db/data.db')

games = {}


@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    socketio.emit('audio_chunk', data)


@socketio.on('player quit')
def player_quit(data):
    print('player quit', data)
    games[data[0]]['players'][data[1]]['player_status'] = 6
    if all([games[data[0]]['players'][i]['player_status'] == 6 for i in games[data[0]]['players']]):
        del games[data[0]]
        db_sess = db_session.create_session()
        db_sess.delete(db_sess.query(Game).filter(Game.code == data[0]).first())
        db_sess.commit()
    print(games)


@socketio.on('player ready')
def player_ready(data):
    print('player ready', data)
    db_sess = db_session.create_session()
    games[data[0]]['players'][data[1]] = {'role': 0, 'player_status': 0, 'name': db_sess.query(User).filter(User.id == data[1]).first().name, 'vote': 0, 'hat': db_sess.query(User).filter(User.id == data[1]).first().hat}
    if len(games[data[0]]['players']) == 4:
        games[data[0]]['game_status'] = 1
        hunter_id = random.choice(list(games[data[0]]['players']))
        games[data[0]]['players'][hunter_id]['role'] = 1
        socketio.emit('starting', [data[0], hunter_id, [[i, games[data[0]]['players'][i]['name'], games[data[0]]['players'][i]['hat']] for i in games[data[0]]['players']]])


@socketio.on('player get info')
def player_get_info(data):
    print('player get info', data)
    games[data[0]]['players'][data[1]]['player_status'] = 1
    if all([games[data[0]]['players'][i]['player_status'] == 1 for i in games[data[0]]['players']]):
        games[data[0]]['game_status'] = 2
        info = generate_info(games[data[0]]['players'])
        socketio.emit('info', [data[0], info])


@socketio.on('player start discuss')
def player_start_discuss(data):
    print('player start discuss', data)
    games[data[0]]['players'][data[1]]['player_status'] = 2
    if all([games[data[0]]['players'][i]['player_status'] == 2 for i in games[data[0]]['players']]):
        games[data[0]]['game_status'] = 3
        socketio.emit('discuss', data[0])


@socketio.on('player get another info')
def player_get_another_info(data):
    print('player get another info', data)
    games[data[0]]['players'][data[1]]['player_status'] = 3
    if all([games[data[0]]['players'][i]['player_status'] == 3 for i in games[data[0]]['players']]):
        games[data[0]]['game_status'] = 2
        info = generate_info(games[data[0]]['players'])
        socketio.emit('new info', [data[0], info])


@socketio.on('player stop another info')
def player_stop_another_info(data):
    print('player stop another info', data)
    games[data[0]]['players'][data[1]]['player_status'] = 2


@socketio.on('player get vote')
def player_get_vote(data):
    print('player get vote', data)
    games[data[0]]['players'][data[1]]['player_status'] = 4
    if all([games[data[0]]['players'][i]['player_status'] == 4 for i in games[data[0]]['players']]):
        games[data[0]]['game_status'] = 4
        socketio.emit('start vote', [data[0]])


@socketio.on('player stop vote')
def player_stop_vote(data):
    print('player stop vote', data)
    games[data[0]]['players'][data[1]]['player_status'] = 2


@socketio.on('player voted')
def player_voted(data):
    print('player voted', data)
    games[data[0]]['players'][data[1]]['player_status'] = 5
    games[data[0]]['players'][data[1]]['vote'] = data[2]
    if all([games[data[0]]['players'][i]['player_status'] == 5 for i in games[data[0]]['players']]):
        games[data[0]]['game_status'] = 5
        hunter = [p for p in games[data[0]]['players'] if games[data[0]]['players'][p]['role'] == 1][0]
        victory = False
        votes = [games[data[0]]['players'][i]['vote'] for i in games[data[0]]['players']]
        counts = [votes.count(votes[i]) for i in range(4)]
        vote = counts.index(max(counts))
        if counts[vote] == 2:
            victory = False
        elif votes[vote] == hunter:
            victory = True
        socketio.emit('vote result', [data[0], victory, hunter])


@socketio.on('get cash')
def get_cash(data):
    print('get cash', data)
    db_sess = db_session.create_session()
    player = db_sess.query(User).filter(User.id == data[0]).first()
    player.cash = player.cash + data[1]
    db_sess.commit()


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
    code = IntegerField('Код игры', validators=[])
    hat = IntegerField('Шляпка', validators=[])
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
        user = User(email=form.email.data, game_code=0, hat=0, cash=0, opened_hats='0')
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
                hat = int(form.hat.data)
                if hat < 0 or hat > 1:
                    hat = 0
                elif hat not in [int(i) for i in user.opened_hats.split(', ')]:
                    hat = 0
                user.hat = hat
                db_sess.commit()
                return redirect('/game')
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
            hat = int(form.hat.data)
            if hat < 0 or hat > 1:
                hat = 0
            elif hat not in [int(i) for i in user.opened_hats.split(', ')]:
                hat = 0
            user.hat = hat
            db_sess.commit()
            return redirect('/game')
    return render_template('join.html', form=form)


@app.route('/buy', methods=['PUT'])
@login_required
def buy():
    data = json.loads(request.data)
    player_id = int(data['player_id'])
    hat = data['hat']
    db_sess = db_session.create_session()
    user = db_sess.query(User).filter(User.id == player_id).first()
    user.opened_hats = user.opened_hats + ', ' + str(hat)
    user.cash = user.cash - 1000000
    db_sess.commit()
    return redirect('/join')


@app.get('/game')
@login_required
def game():
    return render_template('game.html')


if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=8000, debug=False)