const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Holiday = require('../models/Holiday');
const Favorite = require('../models/Favorite');
const File = require('../models/File');
const { ensureBalancesForUser } = require('./leaveBalanceController');

const motivationalQuotes = [
  { quote: "You have to dream before your dreams can come true.", author: "A.P.J. Abdul Kalam" },
  { quote: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.", author: "A.P.J. Abdul Kalam" },
  { quote: "Don't take rest after your first victory because if you fail in second, more lips are waiting to say that your first victory was just luck.", author: "A.P.J. Abdul Kalam" },
  { quote: "Dream is not that which you see while sleeping, it is something that does not let you sleep.", author: "A.P.J. Abdul Kalam" },
  { quote: "All of us do not have equal talent. But, all of us have an equal opportunity to develop our talents.", author: "A.P.J. Abdul Kalam" },
  { quote: "Be yourself; everyone else is already taken.", author: "Mahatma Gandhi" },
  { quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { quote: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
  { quote: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { quote: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { quote: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { quote: "Arise, awake, and stop not until the goal is reached.", author: "Swami Vivekananda" },
  { quote: "Take up one idea. Make that one idea your life - think of it, dream of it, live on that idea.", author: "Swami Vivekananda" },
  { quote: "You cannot believe in God until you believe in yourself.", author: "Swami Vivekananda" },
  { quote: "The greatest religion is to be true to your own nature. Have faith in yourselves.", author: "Swami Vivekananda" },
  { quote: "Stand up, be bold, be strong. Take the whole responsibility on your own shoulders.", author: "Swami Vivekananda" },
  { quote: "All power is within you; you can do anything and everything.", author: "Swami Vivekananda" },
  { quote: "The world is the great gymnasium where we come to make ourselves strong.", author: "Swami Vivekananda" },
  { quote: "In one word, this ideal is that you are divine.", author: "Swami Vivekananda" },
  { quote: "Swaraj is my birthright and I shall have it.", author: "Bal Gangadhar Tilak" },
  { quote: "The Geeta says that we have the right to perform our prescribed duties, but we are not entitled to the fruits of our actions.", author: "Bal Gangadhar Tilak" },
  { quote: "Religion and practical life are not different. To take sannyasa is not to abandon life.", author: "Bal Gangadhar Tilak" },
  { quote: "If we trace the history of any nation backwards into the past, we come at last to a period of myths and traditions.", author: "Bal Gangadhar Tilak" },
  { quote: "The secret to happiness is freedom... And the secret to freedom is courage.", author: "Chandragupta Maurya" },
  { quote: "A person should not be too honest. Straight trees are cut first and honest people are screwed first.", author: "Chanakya" },
  { quote: "Before you start some work, always ask yourself three questions - Why am I doing it, What the results might be and Will I be successful.", author: "Chanakya" },
  { quote: "As soon as the fear approaches near, attack and destroy it.", author: "Chanakya" },
  { quote: "The biggest guru-mantra is: never share your secrets with anybody. It will destroy you.", author: "Chanakya" },
  { quote: "Education is the best friend. An educated person is respected everywhere.", author: "Chanakya" },
  { quote: "A man is great by deeds, not by birth.", author: "Chanakya" },
  { quote: "Once you start working on something, don't be afraid of failure and don't abandon it.", author: "Chanakya" },
  { quote: "The fragrance of flowers spreads only in the direction of the wind. But the goodness of a person spreads in all directions.", author: "Chanakya" },
  { quote: "Books are as useful to a stupid person as a mirror is useful to a blind person.", author: "Chanakya" },
  { quote: "Test a servant while in the discharge of his duty, a relative in difficulty, a friend in adversity, and a wife in misfortune.", author: "Chanakya" },
  { quote: "The one excellent thing that can be learned from a lion is that whatever a man intends doing should be done by him with a whole-hearted and strenuous effort.", author: "Chanakya" },
  { quote: "God is not present in idols. Your feelings are your god. The soul is your temple.", author: "Chanakya" },
  { quote: "Never make friends with people who are above or below you in status. Such friendships will never give you any happiness.", author: "Chanakya" },
  { quote: "Treat your kid like a darling for the first five years. For the next five years, scold them. By the time they turn sixteen, treat them like a friend.", author: "Chanakya" },
  { quote: "Learn from the mistakes of others... you can't live long enough to make them all yourselves.", author: "Chanakya" },
  { quote: "The world's biggest power is the youth and beauty of a woman.", author: "Chanakya" },
  { quote: "There is some self-interest behind every friendship. There is no friendship without self-interests.", author: "Chanakya" },
  { quote: "Even if a snake is not poisonous, it should pretend to be venomous.", author: "Chanakya" },
  { quote: "The happiness and peace attained by those satisfied by the nectar of spiritual tranquillity is not attained by greedy persons restlessly moving here and there.", author: "Chanakya" },
  { quote: "Do not be very upright in your dealings for you would see by going to the forest that straight trees are cut down while crooked ones are left standing.", author: "Chanakya" },
  { quote: "Time perfects all living beings as well as kills them; it alone is awake when all others are asleep.", author: "Chanakya" },
  { quote: "The earth is supported by the power of truth; it is the power of truth that makes the sun shine and the winds blow.", author: "Chanakya" },
  { quote: "He who is overly attached to his family members experiences fear and sorrow, for the root of all grief is attachment.", author: "Chanakya" },
  { quote: "Purity of speech, of the mind, of the senses, and of a compassionate heart are needed by one who desires to rise to the divine platform.", author: "Chanakya" },
  { quote: "We are what our thoughts have made us; so take care about what you think.", author: "Swami Vivekananda" },
  { quote: "Talk to yourself once in a day, otherwise you may miss meeting an excellent person in this world.", author: "Swami Vivekananda" },
  { quote: "The moment I have realized God sitting in the temple of every human body, the moment I stand in reverence before every human being.", author: "Swami Vivekananda" },
  { quote: "If money help a man to do good to others, it is of some value; but if not, it is simply a mass of evil.", author: "Swami Vivekananda" },
  { quote: "Never think there is anything impossible for the soul. It is the greatest heresy to think so.", author: "Swami Vivekananda" },
  { quote: "The fire that warms us can also consume us; it is not the fault of the fire.", author: "Swami Vivekananda" },
  { quote: "Where can we go to find God if we cannot see Him in our own hearts and in every living being.", author: "Swami Vivekananda" },
  { quote: "Condemn none: if you can stretch out a helping hand, do so. If you cannot, fold your hands, bless your brothers, and let them go their own way.", author: "Swami Vivekananda" },
  { quote: "External nature is only internal nature writ large.", author: "Swami Vivekananda" },
  { quote: "God is to be worshipped as the one beloved, dearer than everything in this and next life.", author: "Swami Vivekananda" },
  { quote: "It is our own mental attitude which makes the world what it is for us.", author: "Swami Vivekananda" },
  { quote: "The greatest sin is to think yourself weak.", author: "Swami Vivekananda" },
  { quote: "Truth can be stated in a thousand different ways, yet each one can be true.", author: "Swami Vivekananda" },
  { quote: "You have to grow from the inside out. None can teach you, none can make you spiritual.", author: "Swami Vivekananda" },
  { quote: "Be not afraid of anything. You will do marvelous work.", author: "Swami Vivekananda" },
  { quote: "The goal of mankind is knowledge... Now this knowledge is inherent in man.", author: "Swami Vivekananda" },
  { quote: "Ask nothing; want nothing in return. Give what you have to give; it will come back to you.", author: "Swami Vivekananda" },
  { quote: "Each work has to pass through these stages—ridicule, opposition, and then acceptance.", author: "Swami Vivekananda" },
  { quote: "Dare to be free, dare to go as far as your thought leads, and dare to carry that out in your life.", author: "Swami Vivekananda" },
  { quote: "Do not wait for anybody or anything. Do whatever you can. Build your hope on none.", author: "Swami Vivekananda" },
  { quote: "Feel nothing, know nothing, do nothing, have nothing, give up all to God, and say utterly, 'Thy will be done.'", author: "Swami Vivekananda" },
  { quote: "Fill the brain with high thoughts, highest ideals, place them day and night before you, and out of that will come great work.", author: "Swami Vivekananda" },
  { quote: "First believe in this world—that there is meaning behind everything.", author: "Swami Vivekananda" },
  { quote: "God is present in every jot and tittle of creation.", author: "Swami Vivekananda" },
  { quote: "Hold to the idea, 'I am not the mind, I see that I am thinking, I am watching my mind act,' and each day the identification of yourself with thoughts and feelings will grow less.", author: "Swami Vivekananda" },
  { quote: "If faith in ourselves had been more extensively taught and practiced, I am sure a very large portion of the evils and miseries that we have would have vanished.", author: "Swami Vivekananda" },
  { quote: "If there is no struggle, there is no progress.", author: "Swami Vivekananda" },
  { quote: "If you think yourselves strong, strong you will be.", author: "Swami Vivekananda" },
  { quote: "In a conflict between the heart and the brain, follow your heart.", author: "Swami Vivekananda" },
  { quote: "In a day, when you don't come across any problems - you can be sure that you are travelling in a wrong path.", author: "Swami Vivekananda" },
  { quote: "It is impossible to think about the welfare of the world unless the condition of women is improved.", author: "Swami Vivekananda" },
  { quote: "Learn Everything that is Good from Others, but bring it in, and in your own way absorb it; do not become others.", author: "Swami Vivekananda" },
  { quote: "May I be born again and again, and suffer thousands of miseries so that I may worship the only God that exists, the only God I believe in, the sum total of all souls.", author: "Swami Vivekananda" },
  { quote: "Neither seek nor avoid, take what comes.", author: "Swami Vivekananda" },
  { quote: "Never say 'No', never say, 'I cannot', for you are infinite.", author: "Swami Vivekananda" },
  { quote: "Purity, patience, and perseverance are the three essentials to success and, above all, love.", author: "Swami Vivekananda" },
  { quote: "Strength is Life, Weakness is Death. Expansion is Life, Contraction is Death. Love is Life, Hatred is Death.", author: "Swami Vivekananda" },
  { quote: "The Vedanta recognises no sin it only recognises error. And the greatest error, says the Vedanta is to say that you are weak, that you are a sinner, a miserable creature, and that you have no power and you cannot do this and that.", author: "Swami Vivekananda" },
  { quote: "The whole secret of existence is to have no fear. Never fear what will become of you, depend on no one. Only the moment you reject all help are you freed.", author: "Swami Vivekananda" },
  { quote: "They alone live, who live for others.", author: "Swami Vivekananda" },
  { quote: "Throw away all weakness. Tell your body that it is strong, tell your mind that it is strong, and have unbounded faith and hope in yourself.", author: "Swami Vivekananda" },
  { quote: "We reap what we sow. We are the makers of our own fate.", author: "Swami Vivekananda" },
  { quote: "When we know ourselves to be connected to all others, acting compassionately is simply the natural thing to do.", author: "Swami Vivekananda" },
  { quote: "Whenever we attain a higher vision, the lower vision disappears of itself.", author: "Swami Vivekananda" },
  { quote: "Where there is no struggle, there is no strength.", author: "Swami Vivekananda" },
  { quote: "You are the creator of your own destiny.", author: "Swami Vivekananda" },
  { quote: "You cannot believe in God until you believe in yourself.", author: "Swami Vivekananda" },
  { quote: "Your greatest enemy is your own mind.", author: "Swami Vivekananda" },
  // Foreign Motivational Quotes
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { quote: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney" },
  { quote: "It's kind of fun to do the impossible.", author: "Walt Disney" },
  { quote: "The difference between winning and losing is most often not quitting.", author: "Walt Disney" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "We make a living by what we get, but we make a life by what we give.", author: "Winston Churchill" },
  { quote: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", author: "Winston Churchill" },
  { quote: "Kites rise highest against the wind, not with it.", author: "Winston Churchill" },
  { quote: "Continuous effort - not strength or intelligence - is the key to unlocking our potential.", author: "Winston Churchill" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { quote: "Progress equals happiness.", author: "Tony Robbins" },
  { quote: "The quality of your life is the quality of your relationships.", author: "Tony Robbins" },
  { quote: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { quote: "Success is doing what you want to do, when you want, where you want, with whom you want, as much as you want.", author: "Tony Robbins" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { quote: "Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.", author: "Theodore Roosevelt" },
  { quote: "The only man who never makes a mistake is the man who never does anything.", author: "Theodore Roosevelt" },
  { quote: "Far and away the best prize that life has to offer is the chance to work hard at work worth doing.", author: "Theodore Roosevelt" },
  { quote: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { quote: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford" },
  { quote: "Coming together is a beginning; keeping together is progress; working together is success.", author: "Henry Ford" },
  { quote: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { quote: "Don't find fault, find a remedy.", author: "Henry Ford" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt" },
  { quote: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt" },
  { quote: "You must do the things you think you cannot do.", author: "Eleanor Roosevelt" },
  { quote: "It is better to light a candle than curse the darkness.", author: "Eleanor Roosevelt" },
  { quote: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { quote: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { quote: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison" },
  { quote: "Opportunity is missed by most people because it is dressed in overalls and looks like work.", author: "Thomas Edison" },
  { quote: "The value of an idea lies in the using of it.", author: "Thomas Edison" },
  { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { quote: "Try not to become a person of success, but rather try to become a person of value.", author: "Albert Einstein" },
  { quote: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { quote: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
  { quote: "The important thing is not to stop questioning.", author: "Albert Einstein" },
  { quote: "Logic will get you from A to B. Imagination will take you everywhere.", author: "Albert Einstein" },
  { quote: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
  { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { quote: "The only source of knowledge is experience.", author: "Albert Einstein" },
  { quote: "Weakness of attitude becomes weakness of character.", author: "Albert Einstein" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { quote: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { quote: "Choose a job you love, and you will never have to work a day in your life.", author: "Confucius" },
  { quote: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { quote: "When I let go of what I am, I become what I might be.", author: "Lao Tzu" },
  { quote: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { quote: "He who knows others is wise; he who knows himself is enlightened.", author: "Lao Tzu" },
  { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { quote: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
  { quote: "I can resist everything except temptation.", author: "Oscar Wilde" },
  { quote: "Experience is merely the name men gave to their mistakes.", author: "Oscar Wilde" },
  { quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { quote: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { quote: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { quote: "What we plant in the soil of contemplation, we shall reap in the harvest of action.", author: "Meister Eckhart" },
  { quote: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
  { quote: "Example is not the main thing in influencing others. It is the only thing.", author: "Albert Schweitzer" },
  { quote: "Sometimes our light goes out, but is blown again into instant flame by an encounter with another human being.", author: "Albert Schweitzer" },
  { quote: "The purpose of human life is to serve, and to show compassion and the will to help others.", author: "Albert Schweitzer" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
  { quote: "Courage is not the absence of fear, but action in spite of it.", author: "Mark Twain" },
  { quote: "Kindness is the language which the deaf can hear and the blind can see.", author: "Mark Twain" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do.", author: "Mark Twain" },
  { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { quote: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { quote: "There is only one way to avoid criticism: do nothing, say nothing, and be nothing.", author: "Aristotle" },
  { quote: "Happiness depends upon ourselves.", author: "Aristotle" },
  { quote: "The unexamined life is not worth living.", author: "Socrates" },
  { quote: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { quote: "An unexamined life is not worth living.", author: "Socrates" },
  { quote: "I cannot teach anybody anything. I can only make them think.", author: "Socrates" },
  { quote: "Be kind, for everyone you meet is fighting a hard battle.", author: "Plato" },
  { quote: "The beginning is the most important part of the work.", author: "Plato" },
  { quote: "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.", author: "Plato" },
  { quote: "Courage is knowing what not to fear.", author: "Plato" }
];

const getRandomQuote = () => {
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  return randomQuote;
};

const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    // Ensure balances exist and monthly accruals are applied
    await ensureBalancesForUser(userId, currentYear);

    // Leave balances
    const balances = await LeaveBalance.find({ userId, year: currentYear })
      .populate('leaveTypeId', 'name color')
      .lean();

    const balancesWithAvailable = balances.map(b => ({
      ...b,
      available: b.allocated + b.carryForward - b.used - b.pending
    }));

    // Upcoming leaves
    const upcomingLeaves = await LeaveRequest.find({
      userId,
      status: { $in: ['MANAGER_APPROVED', 'HR_APPROVED'] },
      startDate: { $gte: new Date() }
    })
    .populate('leaveTypeId', 'name color')
    .sort({ startDate: 1 })
    .limit(5);

    // Recent leave history
    const recentLeaves = await LeaveRequest.find({ userId })
      .populate('leaveTypeId', 'name color')
      .sort({ createdAt: -1 })
      .limit(10);

    // Pending requests count
    const pendingCount = await LeaveRequest.countDocuments({
      userId,
      status: 'PENDING'
    });

    // Announcements
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetRoles: { $in: [req.user.role] } },
        { targetRoles: { $size: 0 } }
      ],
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: new Date() } }
      ]
    }).populate('createdBy', 'firstName lastName').sort({ priority: -1, createdAt: -1 }).limit(5);

    // Upcoming holidays
    const upcomingHolidays = await Holiday.find({
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(5);

    // Favorites
    const favorites = await Favorite.find({ userId }).sort({ order: 1 });

    // Employee files
    const files = await File.find({
      $or: [
        { type: 'ORGANIZATION', isPublic: true },
        { type: 'EMPLOYEE', targetUserId: userId }
      ]
    }).populate('uploadedBy', 'firstName lastName').sort({ createdAt: -1 }).limit(10);

    res.json({
      motivationalQuote: getRandomQuote(),
      balances: balancesWithAvailable,
      upcomingLeaves,
      recentLeaves,
      pendingCount,
      announcements,
      upcomingHolidays,
      favorites,
      files
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getManagerDashboard = async (req, res) => {
  try {
    const managerId = req.user.id;
    
    // Team members
    const teamMembers = await User.find({ managerId }).select('_id firstName lastName');
    const teamMemberIds = teamMembers.map(m => m._id);

    // Pending approvals
    const pendingApprovals = await LeaveRequest.find({
      userId: { $in: teamMemberIds },
      status: 'PENDING'
    })
    .populate('userId', 'firstName lastName')
    .populate('leaveTypeId', 'name color')
    .sort({ createdAt: -1 });

    // Team calendar (next 30 days)
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const teamCalendar = await LeaveRequest.find({
      userId: { $in: teamMemberIds },
      status: { $in: ['MANAGER_APPROVED', 'HR_APPROVED'] },
      startDate: { $lte: next30Days },
      endDate: { $gte: new Date() }
    })
    .populate('userId', 'firstName lastName')
    .populate('leaveTypeId', 'name color')
    .sort({ startDate: 1 });

    // Team leave summary
    const currentYear = new Date().getFullYear();
    const teamSummary = await LeaveBalance.aggregate([
      { $match: { userId: { $in: teamMemberIds }, year: currentYear } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'leavetypes',
          localField: 'leaveTypeId',
          foreignField: '_id',
          as: 'leaveType'
        }
      },
      {
        $group: {
          _id: '$userId',
          user: { $first: { $arrayElemAt: ['$user', 0] } },
          totalAllocated: { $sum: { $add: ['$allocated', '$carryForward'] } },
          totalUsed: { $sum: '$used' },
          totalPending: { $sum: '$pending' }
        }
      }
    ]);

    res.json({
      motivationalQuote: getRandomQuote(),
      teamMembers,
      pendingApprovals,
      teamCalendar,
      teamSummary
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getHRDashboard = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();
    const next30Days = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Organization-wide stats
    const totalEmployees = await User.countDocuments({ isActive: true, role: 'EMPLOYEE' });
    
    const leaveStats = await LeaveRequest.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: { $sum: '$days' }
        }
      }
    ]);

    // Monthly leave trends
    const monthlyTrends = await LeaveRequest.aggregate([
      {
        $match: {
          status: 'HR_APPROVED',
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDate' },
          count: { $sum: 1 },
          totalDays: { $sum: '$days' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Leave type usage
    const leaveTypeUsage = await LeaveRequest.aggregate([
      {
        $match: {
          status: 'HR_APPROVED',
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $lookup: {
          from: 'leavetypes',
          localField: 'leaveTypeId',
          foreignField: '_id',
          as: 'leaveType'
        }
      },
      {
        $group: {
          _id: '$leaveTypeId',
          leaveType: { $first: { $arrayElemAt: ['$leaveType', 0] } },
          count: { $sum: 1 },
          totalDays: { $sum: '$days' }
        }
      }
    ]);

    // Pending approvals
    const pendingApprovals = await LeaveRequest.countDocuments({
      status: { $in: ['PENDING', 'MANAGER_APPROVED'] }
    });

    // Upcoming birthdays (next 30 days)
    const upcomingBirthdays = await User.find({
      isActive: true,
      dateOfBirth: { $exists: true }
    }).select('firstName lastName dateOfBirth department');

    const birthdaysInRange = upcomingBirthdays.filter(user => {
      const birthday = new Date(user.dateOfBirth);
      const thisYearBirthday = new Date(currentYear, birthday.getMonth(), birthday.getDate());
      const nextYearBirthday = new Date(currentYear + 1, birthday.getMonth(), birthday.getDate());
      
      return (thisYearBirthday >= currentDate && thisYearBirthday <= next30Days) ||
             (nextYearBirthday >= currentDate && nextYearBirthday <= next30Days);
    }).sort((a, b) => {
      const aBirthday = new Date(currentYear, new Date(a.dateOfBirth).getMonth(), new Date(a.dateOfBirth).getDate());
      const bBirthday = new Date(currentYear, new Date(b.dateOfBirth).getMonth(), new Date(b.dateOfBirth).getDate());
      return aBirthday - bBirthday;
    });

    // New hires (last 30 days)
    const newHires = await User.find({
      isActive: true,
      joinDate: { $gte: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000) }
    }).select('firstName lastName joinDate department').sort({ joinDate: -1 });

    res.json({
      motivationalQuote: getRandomQuote(),
      totalEmployees,
      leaveStats,
      monthlyTrends,
      leaveTypeUsage,
      pendingApprovals,
      upcomingBirthdays: birthdaysInRange,
      newHires
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const exportLeaveReport = async (req, res) => {
  try {
    const { startDate, endDate, userId, leaveTypeId } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (userId) filter.userId = userId;
    if (leaveTypeId) filter.leaveTypeId = leaveTypeId;

    const leaves = await LeaveRequest.find(filter)
      .populate('userId', 'firstName lastName email department')
      .populate('leaveTypeId', 'name')
      .sort({ startDate: -1 });

    const csvData = leaves.map(leave => ({
      Employee: `${leave.userId.firstName} ${leave.userId.lastName}`,
      Email: leave.userId.email,
      Department: leave.userId.department || '',
      LeaveType: leave.leaveTypeId.name,
      StartDate: leave.startDate.toISOString().split('T')[0],
      EndDate: leave.endDate.toISOString().split('T')[0],
      Days: leave.days,
      Status: leave.status,
      Reason: leave.reason,
      IsLOP: leave.isLOP ? 'Yes' : 'No'
    }));

    res.json(csvData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getEmployeeDashboard,
  getManagerDashboard,
  getHRDashboard,
  exportLeaveReport
};