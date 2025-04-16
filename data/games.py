import sqlalchemy
from sqlalchemy import orm

from .db_session import SqlAlchemyBase


class Game(SqlAlchemyBase):
    __tablename__ = 'games'

    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True, autoincrement=True)
    code = sqlalchemy.Column(sqlalchemy.Integer)
    leader = sqlalchemy.Column(sqlalchemy.Integer)

    users = orm.relationship('User', back_populates='game')