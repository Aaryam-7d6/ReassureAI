from .connection import get_db
from .models.user import User
from .models.conversation import Conversation
from .models.report import Report
from .models.feedback import Feedback
from .models.document import UploadedDocument

async def init_indexes():
    await User.ensure_indexes()
    await Conversation.ensure_indexes()
    await Report.ensure_indexes()
    await Feedback.ensure_indexes()
    await UploadedDocument.ensure_indexes()
    db = await get_db()
    await db.documents.create_index([("user_id", 1), ("file_hash", 1)], unique=True)
