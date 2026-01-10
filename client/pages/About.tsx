import { Link } from "react-router-dom";
import { CheckCircle2, Crown, Shield, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface TeamMember {
  uid: string;
  username: string;
  displayName: string;
  profileImage?: string;
  role: string;
}

const getRoleInfo = (role: string) => {
  switch (role) {
    case "founder":
      return {
        label: "Founder",
        icon: "https://cdn.builder.io/api/v1/image/assets%2F6efe5c975de742218614020f75c6e644%2Fb430cdb925bf47f09a9d7c95a02f3bd0?format=webp&width=800",
      };
    case "admin":
      return {
        label: "Admin",
        icon: "https://cdn.builder.io/api/v1/image/assets%2F6efe5c975de742218614020f75c6e644%2Fb5f004c16bc84ddd977be6eea56f8f20?format=webp&width=800",
      };
    case "partner":
      return {
        label: "Partner",
        icon: "https://cdn3.emoji.gg/emojis/42747-roblox-verified.png",
      };
    case "support":
      return {
        label: "Support",
        icon: "https://cdn3.emoji.gg/emojis/42747-roblox-verified.png",
      };
    default:
      return {
        label: role,
        icon: "https://cdn3.emoji.gg/emojis/42747-roblox-verified.png",
      };
  }
};

export default function About() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        // Fetch users with staff/founder/admin/partner roles
        const staffRoles = ["founder", "admin", "partner", "support"];
        const q = query(
          collection(db, "users"),
          where("role", "in", staffRoles),
        );
        const querySnapshot = await getDocs(q);

        const members: TeamMember[] = querySnapshot.docs.map((doc) => ({
          uid: doc.id,
          username: doc.data().username,
          displayName: doc.data().displayName,
          profileImage: doc.data().profileImage,
          role: doc.data().role,
        }));

        setTeamMembers(members);
      } catch (error) {
        console.error("Error fetching team members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const teamByRole = {
    founder: teamMembers.filter((m) => m.role === "founder"),
    admin: teamMembers.filter((m) => m.role === "admin"),
    partner: teamMembers.filter((m) => m.role === "partner"),
    support: teamMembers.filter((m) => m.role === "support"),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border/50 py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">About RbxAssets</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              A trusted digital asset marketplace for creators, developers, and
              studios.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-8 md:py-10 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-bold mb-3">Our Mission</h2>
              <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                RbxAssets is a marketplace built by creators, for creators. We
                believe high-quality digital assets should be accessible to
                everyone.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our commitment: quality curation, fair pricing, and zero
                compromises on security.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border border-border/50 h-64">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop"
                alt="Team collaboration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-8 md:py-10 border-b border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Core Values</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
              <h3 className="font-semibold text-xs">Quality</h3>
              <p className="text-xs text-muted-foreground">
                Every asset is reviewed for quality, compatibility, and
                compliance.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
              <h3 className="font-semibold text-xs">Creator-First</h3>
              <p className="text-xs text-muted-foreground">
                Fair compensation and tools that empower creators.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
              <h3 className="font-semibold text-xs">Security</h3>
              <p className="text-xs text-muted-foreground">
                Enterprise-grade security for all transactions and data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-8 md:py-10 border-b border-border/50">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Our Team</h2>

          {loading ? (
            <div className="text-center text-muted-foreground">
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No team members yet</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Founders */}
              {teamByRole.founder.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Crown size={20} className="text-yellow-400" />
                    <h3 className="text-lg font-semibold">Founders</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {teamByRole.founder.map((member) => (
                      <TeamCard key={member.uid} member={member} />
                    ))}
                  </div>
                </div>
              )}

              {/* Admins */}
              {teamByRole.admin.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield size={20} className="text-red-400" />
                    <h3 className="text-lg font-semibold">Administrators</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {teamByRole.admin.map((member) => (
                      <TeamCard key={member.uid} member={member} />
                    ))}
                  </div>
                </div>
              )}

              {/* Partners */}
              {teamByRole.partner.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-blue-400" />
                    <h3 className="text-lg font-semibold">Partners</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {teamByRole.partner.map((member) => (
                      <TeamCard key={member.uid} member={member} />
                    ))}
                  </div>
                </div>
              )}

              {/* Support */}
              {teamByRole.support.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-green-400" />
                    <h3 className="text-lg font-semibold">Support Team</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {teamByRole.support.map((member) => (
                      <TeamCard key={member.uid} member={member} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Get Started</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join creators and developers using RbxAssets to find and share
            digital assets.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/marketplace"
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all inline-flex items-center justify-center gap-2"
            >
              Browse Assets
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 rounded-lg bg-secondary border border-border/30 text-foreground font-medium text-sm hover:bg-secondary/80 transition-all inline-flex items-center justify-center gap-2"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const roleInfo = getRoleInfo(member.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="text-center space-y-3">
      <div className="w-full aspect-square mx-auto rounded-lg overflow-hidden border border-border/30">
        <img
          src={
            member.profileImage ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`
          }
          alt={member.displayName}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <h3 className="font-semibold text-sm text-foreground">
          {member.displayName}
        </h3>
        <p className="text-xs text-muted-foreground">@{member.username}</p>
        <div className="mt-2 flex justify-center">
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${roleInfo.color}`}
          >
            <RoleIcon size={12} />
            {roleInfo.label}
          </div>
        </div>
      </div>
    </div>
  );
}
