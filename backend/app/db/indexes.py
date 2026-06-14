from .connection import get_db
from .models.user import User
from .models.conversation import Conversation
from .models.report import Report
from .models.feedback import Feedback

async def init_indexes():
    await User.ensure_indexes()
    await Conversation.ensure_indexes()
    await Report.ensure_indexes()
    await Feedback.ensure_indexes()
