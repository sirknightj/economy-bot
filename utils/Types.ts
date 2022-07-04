import { Client, Collection, ApplicationCommandOptionData, Message, CommandInteraction, AutocompleteInteraction } from "discord.js";

export interface Bot extends Client {
    commands: Collection<string, any>;
};

export interface Command {
    name: string;
    description: string;
	options?: ApplicationCommandOptionData[];
	enabled: boolean;
    permissions?: string | string[];
	aliases?: string[];
	/**
	 * Function to be called when the command is initially loaded.
	 * If successful, returns void (nothing). If a failure occurs, returns an error message.
	 */
    init?: () => Promise<string | void>;
    execute: (client: Bot, message: Message, interaction: CommandInteraction) => Promise<void>;
    handleAutocomplete?: (client: Bot, interaction: AutocompleteInteraction) => Promise<void>;
};

export interface BazaarData {
	success: true;
	/** The UNIX timestamp of when this page was last updated. */
	lastUpdated: number;
	products: {
		[id: string]: {
			/** The Hypixel item id, for example `INK_SACK:3`, `JERRY_BOX_GREEN`. */
			product_id: string;
			/** The top 30 sell orders. */
			sell_summary: BuySellSummary[];
			/** The top 30 buy orders. */
            buy_summary: BuySellSummary[];
			
			/** The summary of the product, used for advanced view in-game. */
			quick_status: {
				/** The Hypixel item id, for example `INK_SACK:3`, `JERRY_BOX_GREEN`. */
				productId: string;
				/** The weighted average of the top 2% sell orders by volume. */
				sellPrice: number;
				/** The sum of all item amounts in all sell orders. */
				sellVolume: number;
				/** The total number of items that have been instasold in the past week. */
				sellMovingWeek: number;
				/** The number of active sell orders. */
				sellOrders: number;
				/** The weighted average of the top 2% buy orders by volume. */
				buyPrice: number;
				/** The sum of all item amounts in all buy orders. */
				buyVolume: number;
				/** The total number of items that have been instabought in the past week. */
				buyMovingWeek: number;
				/** The number of active buy orders. */
				buyOrders: number;
			};
		};
	};
};

export interface BuySellSummary {
    /** The number of items that are being bought/sold. */
    amount: number;
    /** The number of coins that each individual item is being bought/sold for. */
    pricePerUnit: number;
    /**
     * The number of active buy/sell orders that have the same price
     * per unit. 
     */
    orders: number;
}