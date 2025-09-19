import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminPage from "./page";
import { vi } from "vitest";

type FetchResponseInit = {
  ok?: boolean;
  status?: number;
  body?: any;
};

function createFetchResponse({ ok = true, status = 200, body = {} }: FetchResponseInit) {
  const payload = body;
  const serialized = body === null ? "" : JSON.stringify(body);
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(serialized),
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

global.fetch = vi.fn();
window.confirm = vi.fn(() => true);

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
};
const mockSupabase = {
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display unauthorized message if fetch returns 401", async () => {
    (fetch as vi.Mock).mockResolvedValueOnce(
      createFetchResponse({ ok: false, status: 401, body: { error: "Unauthorized" } })
    );

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("관리자 권한이 필요합니다.")).toBeInTheDocument();
    });
  });

  it("should display a list of rooms on successful fetch", async () => {
    const mockRooms = [{ id: "1", name: "Room 1", location: "1F", capacity: 10 }];
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: { data: mockRooms } }));

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText("Room 1")).toBeInTheDocument();
    });
  });

  it("should allow creating a new room", async () => {
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: { data: [] } }));
    (fetch as vi.Mock).mockResolvedValueOnce(
      createFetchResponse({ body: { data: { id: "3", name: "New Room", location: "3F", capacity: 8 } } })
    );
    const newMockRooms = [{ id: "3", name: "New Room", location: "3F", capacity: 8 }];
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: { data: newMockRooms } }));

    render(<AdminPage />);

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "New Room" } });
    fireEvent.change(screen.getByLabelText("위치"), { target: { value: "3F" } });
    fireEvent.change(screen.getByLabelText("수용 인원"), { target: { value: "8" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/rooms",
        expect.objectContaining({ method: "POST" })
      );
    });
    await waitFor(() => {
      expect(screen.getByText("New Room")).toBeInTheDocument();
    });
  });

  it("should allow editing a room", async () => {
    const initialRooms = [{ id: "1", name: "Old Name", location: "1F", capacity: 10 }];
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: { data: initialRooms } }));
    (fetch as vi.Mock).mockResolvedValueOnce(
      createFetchResponse({ body: { data: { id: "1", name: "New Name", location: "1F", capacity: 10 } } })
    );
    const updatedRooms = [{ id: "1", name: "New Name", location: "1F", capacity: 10 }];
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: { data: updatedRooms } }));

    render(<AdminPage />);

    const listItem = await screen.findByText("Old Name");
    const parentLi = listItem.closest("li");
    const editButton = within(parentLi!).getByRole("button", { name: "수정" });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByLabelText("이름")).toHaveValue("Old Name");
    });

    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "New Name" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/rooms",
        expect.objectContaining({ method: "PUT" })
      );
    });
    await waitFor(() => {
      expect(screen.getByText("New Name")).toBeInTheDocument();
    });
  });

  it("should allow deleting a room", async () => {
    const initialRooms = [{ id: "1", name: "To Delete", location: "1F", capacity: 10 }];
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: { data: initialRooms } }));
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: {} }));
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: { data: [] } }));

    render(<AdminPage />);

    const listItem = await screen.findByText("To Delete");
    const parentLi = listItem.closest("li");
    const deleteButton = within(parentLi!).getByRole("button", { name: "삭제" });
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/admin/rooms?id=1`, { method: "DELETE" });
    });
    await waitFor(() => {
      expect(screen.queryByText("To Delete")).not.toBeInTheDocument();
    });
  });

  it("should reload rooms on database change event", async () => {
    (fetch as vi.Mock).mockResolvedValueOnce(createFetchResponse({ body: { data: [] } }));

    render(<AdminPage />);

    await waitFor(() =>
      expect(mockSupabase.channel).toHaveBeenCalledWith("meeting_rooms:realtime")
    );

    const onCallback = mockChannel.on.mock.calls[0][2];
    expect(onCallback).toBeInstanceOf(Function);

    (fetch as vi.Mock).mockResolvedValueOnce(
      createFetchResponse({ body: { data: [{ id: "realtime", name: "Realtime Room" }] } })
    );
    await onCallback({});

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Realtime Room")).toBeInTheDocument();
    });
  });
});

