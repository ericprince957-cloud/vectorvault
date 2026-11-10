"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Cropper, { type Area } from "react-easy-crop";
import { createClient } from "@/lib/supabase/client";

export type ProfileData = {
  username: string;
  full_name: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  github_url: string | null;
  skills: string[] | null;
  avatar_url: string | null;
};

function createCroppedImage(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Could not create image crop."));
        return;
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      context.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not process the cropped image."));
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = imageSrc;
  });
}

export default function ProfileForm({
  profile,
}: {
  profile: ProfileData;
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [location, setLocation] = useState(profile.location || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [skills, setSkills] = useState((profile.skills || []).join(", "));

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    setError(null);
    setSaved(false);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your image must be smaller than 5MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };

    reader.onerror = () => {
      setError("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleAvatarUpload() {
    if (!imageSrc || !croppedAreaPixels) {
      setError("Please select and crop an image first.");
      return;
    }

    setAvatarLoading(true);
    setError(null);
    setSaved(false);

    try {
      const croppedBlob = await createCroppedImage(
        imageSrc,
        croppedAreaPixels
      );

      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be signed in to update your picture.");
      }

      const filePath = `${user.id}/avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) {
        await supabase.storage.from("avatars").remove([filePath]);
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      setImageSrc(null);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating your picture."
      );
    } finally {
      setAvatarLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    const skillsArray = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        website: website.trim() || null,
        location: location.trim() || null,
        github_url: githubUrl.trim() || null,
        skills: skillsArray,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
    router.refresh();
  }

  const fields = [
    {
      id: "fullName",
      label: "Full name",
      value: fullName,
      set: setFullName,
      placeholder: "Prince Eric",
    },
    {
      id: "location",
      label: "Location",
      value: location,
      set: setLocation,
      placeholder: "Lagos, Nigeria",
    },
    {
      id: "website",
      label: "Website",
      value: website,
      set: setWebsite,
      placeholder: "https://your-site.com",
    },
    {
      id: "github",
      label: "GitHub profile",
      value: githubUrl,
      set: setGithubUrl,
      placeholder: "https://github.com/username",
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-white/10 bg-[#141414] p-8"
    >
      <div>
        <h2 className="mb-4 text-sm font-semibold text-white">
          Profile picture
        </h2>

        <div className="flex flex-wrap items-center gap-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your profile"
              className="h-20 w-20 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 text-2xl font-bold text-[#E5C76B]">
              {(fullName || profile.username).charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <label
              htmlFor="avatar-upload"
              className="inline-block cursor-pointer rounded-lg border border-white/15 px-4 py-2.5 text-xs text-zinc-200 transition hover:border-[#C9A227]/60 hover:text-white"
            >
              Choose a picture
            </label>

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <p className="mt-2 text-[11px] text-zinc-500">
              JPG, PNG or WebP. Maximum 5MB.
            </p>
          </div>
        </div>
      </div>

      {imageSrc && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-[#090909] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Adjust your picture
            </h3>

            <button
              type="button"
              onClick={() => setImageSrc(null)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="relative mx-auto h-72 w-full max-w-sm overflow-hidden rounded-xl bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) =>
                setCroppedAreaPixels(croppedPixels)
              }
            />
          </div>

          <div>
            <div className="mb-2 flex justify-between text-xs text-zinc-400">
              <span>Zoom</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#C9A227]"
            />
          </div>

          <button
            type="button"
            onClick={handleAvatarUpload}
            disabled={avatarLoading || !croppedAreaPixels}
            className="w-full rounded-lg bg-[#C9A227] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
          >
            {avatarLoading ? "Uploading picture..." : "Update profile picture"}
          </button>
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-[#090909] px-4 py-3">
        <p className="text-xs text-zinc-500">Username (permanent)</p>
        <p className="text-sm text-[#E5C76B]">@{profile.username}</p>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label
            htmlFor={field.id}
            className="mb-1.5 block text-xs text-zinc-400"
          >
            {field.label}
          </label>

          <input
            id={field.id}
            type="text"
            value={field.value}
            onChange={(e) => field.set(e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
          />
        </div>
      ))}

      <div>
        <label
          htmlFor="bio"
          className="mb-1.5 block text-xs text-zinc-400"
        >
          Bio
        </label>

        <textarea
          id="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short biography — who you are and what you build."
          className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
        />
      </div>

      <div>
        <label
          htmlFor="skills"
          className="mb-1.5 block text-xs text-zinc-400"
        >
          Skills (comma separated)
        </label>

        <input
          id="skills"
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="TypeScript, Next.js, Supabase"
          className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </p>
      )}

      {saved && (
        <p className="rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 px-4 py-3 text-xs text-[#E5C76B]">
          Changes saved successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}