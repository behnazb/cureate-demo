# Persona — the prototype's stand-in for auth.
#
# There is no user, no role table, and no login. The sidebar identity block (where
# a real app would show the signed-in user's email) is a click-to-switch control:
# pick Buyer or Vendor and the whole app re-scopes. The choice lives in the session.
#
# Deliberately NOT modeled here: roles, permissions, admin settings, Cureator.
# When Cureator becomes real it slots in as a third entry in KEYS.
class Persona
  BUYER  = "buyer".freeze
  VENDOR = "vendor".freeze
  KEYS   = [BUYER, VENDOR].freeze

  DEFINITIONS = {
    BUYER => {
      key:       BUYER,
      label:     "Buyer",
      org:       "Johns Hopkins University",
      email:     "buyer@jhu.edu",
      initials:  "JH",
      avatar_bg: "#28ba93",
      logo:      nil,
      home:      "/products",
    },
    # 2Betties is an existing vendor in the buyer marketplace — same orders, other
    # side of the table. That's the point: switching personas shows the same POs
    # from the vendor's view, with nothing fabricated.
    VENDOR => {
      key:       VENDOR,
      label:     "Vendor",
      org:       "2Betties",
      email:     "hello@2betties.com",
      initials:  "2B",
      avatar_bg: "#a33500",
      logo:      "/vendors/2betties/logo.jpeg",
      vendor_id: "2betties",
      home:      "/vendor/dashboard",
    },
  }.freeze

  def self.valid?(key)
    KEYS.include?(key.to_s)
  end

  def self.normalize(key)
    valid?(key) ? key.to_s : BUYER
  end

  def self.find(key)
    DEFINITIONS[normalize(key)]
  end

  def self.all
    KEYS.map { |k| DEFINITIONS[k] }
  end
end
