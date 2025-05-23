import sqlalchemy
from sqlalchemy import orm
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from .db_session import SqlAlchemyBase


class User(SqlAlchemyBase, UserMixin):
    __tablename__ = 'users'

    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    email = sqlalchemy.Column(sqlalchemy.String, unique=True)
    hashed_password = sqlalchemy.Column(sqlalchemy.String)
    game_code = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey('games.code'))
    name = sqlalchemy.Column(sqlalchemy.String)
    hat = sqlalchemy.Column(sqlalchemy.Integer)
    cash = sqlalchemy.Column(sqlalchemy.Integer)
    opened_hats = sqlalchemy.Column(sqlalchemy.String)

    game = orm.relationship('Game')

    def set_password(self, password):
        self.hashed_password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.hashed_password, password)