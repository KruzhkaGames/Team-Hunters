import flask
from flask import make_response, jsonify

from . import db_session
from .games import Game
from .users import User

blueprint = flask.Blueprint('games_api', __name__, template_folder='templates')


@blueprint.get('/api/users')
def get_users():
    db_sess = db_session.create_session()
    users = []
    for user in db_sess.query(User).all():
        users.append({'id': user.id, 'email': user.email, 'game_code': user.game_code, 'cash': user.cash, 'opened_hats': [int(i) for i in user.opened_hats.split(', ')]})
    return {'users': users}


@blueprint.get('/api/user/<int:user_id>')
def get_user_by_id(user_id):
    db_sess = db_session.create_session()
    user = db_sess.query(User).filter(User.id == user_id).first()
    if user:
        return {'id': user.id, 'email': user.email, 'game_code': user.game_code, 'cash': user.cash, 'opened_hats': [int(i) for i in user.opened_hats.split(', ')]}
    else:
        return make_response(jsonify({'error': 'Not found'}), 404)


@blueprint.get('/api/games')
def get_games():
    db_sess = db_session.create_session()
    games = []
    for game in db_sess.query(Game).all():
        games.append({'id': game.id, 'code': game.code, 'leader': game.leader})
    return {'games': games}


@blueprint.get('/api/game/<int:game_id>')
def get_game_by_id(game_id):
    db_sess = db_session.create_session()
    game = db_sess.query(Game).filter(Game.id == game_id).first()
    if game:
        return {'id': game.id, 'code': game.code, 'leader': game.leader}
    else:
        return make_response(jsonify({'error': 'Not found'}), 404)