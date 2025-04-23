from data import db_session
from data.users import User
from data.games import Game

db_session.global_init('db/data.db')

db_sess = db_session.create_session()
for el in db_sess.query(Game).all():
    print(el.id, el.code)