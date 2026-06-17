"use client";

import { useRef, useState } from "react";

import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditProfileFormProps {
  initialProfile: {
    username: string;
    full_name: string;
    email: string;
    job_title: string;
    company: string;
    phone: string;
    bio: string;
    avatar_url: string;
  };
  initialSocialLinks: { id?: string; platform: string; url: string }[];
}

type SocialLink = {
  id?: string;
  platform: string;
  url: string;
};

export default function EditProfileForm({
  initialProfile,
  initialSocialLinks,
}: EditProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(initialProfile);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    initialSocialLinks.length > 0
      ? initialSocialLinks
      : [{ platform: "website", url: "" }]
  );

  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  // avatarPreview may be an existing remote URL or a local object URL
  const [avatarPreview, setAvatarPreview] = useState<string>(
    initialProfile.avatar_url ?? ""
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.target.name === "username") {
      const normalized = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
      setForm({ ...form, username: normalized });
      return;
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Only revoke if it's a local object URL (not a remote http URL)
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ---- Social link handlers ----
  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, { platform: "website", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    setSocialLinks((prev) =>
      prev.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to update your profile");
        return;
      }

      // 1. Upload new avatar if a file was selected
      let avatarUrl = form.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          toast.error(uploadError.message);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }

      // 2. UPDATE the profile row
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: form.username,
          full_name: form.full_name,
          job_title: form.job_title,
          company: form.company,
          phone: form.phone,
          bio: form.bio,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (profileError) {
        toast.error(profileError.message);
        return;
      }

      // 3. Sync social links: delete existing first, then insert current set
      const { error: deleteError } = await supabase
        .from("social_links")
        .delete()
        .eq("profile_id", user.id);

      if (deleteError) {
        console.error("social_links delete error:", deleteError);
        toast.error(
          "Could not update social links (delete failed). Check that your database allows deleting social links."
        );
        return;
      }

      const linksToInsert = socialLinks
        .filter((link) => link.url.trim().length > 0)
        .map((link) => ({
          profile_id: user.id,
          platform: link.platform,
          url: link.url.trim(),
        }));

      if (linksToInsert.length > 0) {
        const { error: linksError } = await supabase
          .from("social_links")
          .insert(linksToInsert);

        if (linksError) {
          console.error("social_links insert error:", linksError);
          toast.error(
            "Profile updated, but we couldn't save your social links. Please try again."
          );
          return;
        }
      }

      toast.success("Profile updated successfully");
      // Refresh first to update the cached server-component data,
      // then push to navigate to the freshly-fetched profile page.
      router.refresh();
      router.push(`/${form.username}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-500";

  const disabledInputClassName =
    "w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-500 cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit your ID Card
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Update your details and links.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-100 transition-colors hover:border-zinc-400 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={32}
                  height={32}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute inset-0 m-auto text-zinc-400 dark:text-zinc-500"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {avatarPreview ? "Click to change photo" : "Click to upload photo"}
            </p>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Username <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="johndoe"
              value={form.username}
              onChange={handleChange}
              required
              className={inputClassName}
            />
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="full_name"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Full Name
            </label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          {/* Email (locked) */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email{" "}
              <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                (locked)
              </span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              disabled
              className={disabledInputClassName}
            />
          </div>

          {/* Job Title + Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="job_title"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Job Title
              </label>
              <input
                id="job_title"
                type="text"
                name="job_title"
                placeholder="Software Engineer"
                value={form.job_title}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="company"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Company
              </label>
              <input
                id="company"
                type="text"
                name="company"
                placeholder="Acme Inc."
                value={form.company}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="+44 7700 900000"
              value={form.phone}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              placeholder="What is something you want your clients to know about you?"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className={inputClassName}
            />
          </div>

          {/* ---- Social Links (dynamic) ---- */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Social Links
              </label>
              <button
                type="button"
                onClick={addSocialLink}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Link
              </button>
            </div>

            <div className="scrollable-links flex min-h-10 max-h-12 flex-col gap-2 overflow-y-auto pr-1">
              {socialLinks.map((link, index) => {
                const platform = SOCIAL_PLATFORMS.find(
                  (p) => p.id === link.platform
                );
                const PlatformIcon = platform?.icon;
                return (
                  <div key={index} className="flex shrink-0 items-start gap-2">
                    {/* Platform dropdown (with icon prefix) */}
                    <div className="relative shrink-0">
                      {PlatformIcon && (
                        <PlatformIcon className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                      )}
                      <select
                        value={link.platform}
                        onChange={(e) =>
                          updateSocialLink(index, "platform", e.target.value)
                        }
                        className={`w-36 rounded-lg border border-zinc-300 bg-white py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 ${
                          PlatformIcon ? "pl-8 pr-2" : "px-2"
                        }`}
                      >
                      {SOCIAL_PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                      </select>
                    </div>

                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) =>
                        updateSocialLink(index, "url", e.target.value)
                      }
                      placeholder={platform?.placeholder ?? "https://..."}
                      className={inputClassName}
                    />

                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="mt-0.5 shrink-0 cursor-pointer rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                      aria-label="Remove link"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="flex-1 cursor-pointer rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 cursor-pointer rounded-lg bg-(--main-orange) px-4 py-3 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCancelDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Discard changes?
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              If you leave now, any unsaved changes will be lost and you will go
              back to your profile card.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 cursor-pointer rounded-lg bg-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => router.push(`/${form.username}`)}
                className="flex-1 cursor-pointer rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}